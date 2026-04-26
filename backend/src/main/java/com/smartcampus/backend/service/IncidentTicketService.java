package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.exception.TicketException;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class IncidentTicketService {

    private final IncidentTicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;

    private static final int MAX_ATTACHMENTS = 3;

    public IncidentTicketService(
            IncidentTicketRepository ticketRepository,
            TicketCommentRepository commentRepository,
            TicketAttachmentRepository attachmentRepository,
            UserRepository userRepository,
            ResourceRepository resourceRepository,
            FileStorageService fileStorageService) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.fileStorageService = fileStorageService;
    }

    // ========== GET ALL TICKETS (Role-based) ==========
    // User → own tickets only
    // Technician → assigned tickets + OPEN unassigned tickets
    // Admin/Super Admin → all tickets
    @Transactional(readOnly = true)
    public Map<String, Object> getAll(String status, String priority, Pageable pageable, User caller) {
        Page<IncidentTicket> page;
        
        if (isAdmin(caller)) {
            // Admin/Super Admin: see all tickets
            if (status != null && priority != null) 
                page = ticketRepository.findByStatusAndPriority(status, priority, pageable);
            else if (status != null) 
                page = ticketRepository.findByStatus(status, pageable);
            else if (priority != null) 
                page = ticketRepository.findByPriority(priority, pageable);
            else 
                page = ticketRepository.findAll(pageable);
        } else if (isTechnician(caller)) {
            // Technician: see assigned tickets + OPEN unassigned tickets
            
            // Get assigned tickets
            Page<IncidentTicket> assignedPage = ticketRepository.findByAssignee_Id(caller.getId(), pageable);
            
            // Get unassigned OPEN tickets (only OPEN, not IN_PROGRESS)
            Page<IncidentTicket> unassignedPage = ticketRepository.findByStatusInAndAssigneeIsNull(
                List.of("OPEN"), pageable);
            
            // Merge both lists
            List<IncidentTicket> mergedList = Stream.concat(
                assignedPage.getContent().stream(),
                unassignedPage.getContent().stream()
            ).distinct().collect(Collectors.toList());
            
            // Sort by createdAt descending
            mergedList.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            
            // Apply status filter if provided
            if (status != null && !status.isEmpty()) {
                mergedList = mergedList.stream()
                    .filter(t -> t.getStatus().equals(status))
                    .collect(Collectors.toList());
            }
            
            // Apply priority filter if provided
            if (priority != null && !priority.isEmpty()) {
                mergedList = mergedList.stream()
                    .filter(t -> t.getPriority().equals(priority))
                    .collect(Collectors.toList());
            }
            
            // Apply pagination manually
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), mergedList.size());
            List<IncidentTicket> pagedList = start < mergedList.size() ? mergedList.subList(start, end) : List.of();
            
            page = new PageImpl<>(pagedList, pageable, mergedList.size());
        } else {
            // Regular User: see only their own tickets
            if (status != null && priority != null) 
                page = ticketRepository.findByReporter_IdAndStatusAndPriority(caller.getId(), status, priority, pageable);
            else if (status != null) 
                page = ticketRepository.findByReporter_IdAndStatus(caller.getId(), status, pageable);
            else if (priority != null) 
                page = ticketRepository.findByReporter_IdAndPriority(caller.getId(), priority, pageable);
            else 
                page = ticketRepository.findByReporter_Id(caller.getId(), pageable);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("currentPage", page.getNumber());
        response.put("tickets", page.getContent().stream().map(this::toTicketMap).collect(Collectors.toList()));
        return response;
    }

    // ========== GET SINGLE TICKET ==========
    @Transactional(readOnly = true)
    public Map<String, Object> getTicketById(Long ticketId, User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);
        enforceReadAccess(ticket, caller);
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("ticket", toTicketMap(ticket));
        return response;
    }

    // ========== CREATE TICKET ==========
    @Transactional
    public Map<String, Object> create(Map<String, Object> body, List<MultipartFile> files, Long reporterId) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException(reporterId));

        if (files != null && files.size() > MAX_ATTACHMENTS) {
            throw new TicketException.InvalidOperation("Maximum " + MAX_ATTACHMENTS + " attachments allowed.");
        }

        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle((String) body.get("title"));
        ticket.setCategory((String) body.get("category"));
        ticket.setDescription((String) body.get("description"));
        ticket.setPriority((String) body.get("priority"));
        ticket.setContactDetails((String) body.get("contactDetails"));
        ticket.setReporter(reporter);
        ticket.setStatus("OPEN");

        // Handle resource association if provided
        Object resourceIdObj = body.get("resourceId");
        if (resourceIdObj != null) {
            Long resourceId = Long.parseLong(resourceIdObj.toString());
            Resource resource = resourceRepository.findById(resourceId)
                    .orElseThrow(() -> new ResourceNotFoundException(resourceId));
            ticket.setResource(resource);
        }

        IncidentTicket saved = ticketRepository.save(ticket);

        // Handle file attachments
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String fileUrl = fileStorageService.storeAttachment(file);
                    TicketAttachment attachment = new TicketAttachment();
                    attachment.setTicket(saved);
                    attachment.setFileUrl(fileUrl);
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setFileType(file.getContentType());
                    attachment.setFileSize(file.getSize());
                    attachmentRepository.save(attachment);
                }
            }
        }

        return Map.of("success", true, "message", "Ticket created successfully.", "ticket", toTicketMap(saved));
    }

    // ========== GET AVAILABLE TECHNICIANS ==========
    // Get all users and filter by TECHNICIAN role (since we cannot modify UserRepository)
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailableTechnicians() {
        List<User> allUsers = userRepository.findAll();
        List<User> technicians = allUsers.stream()
            .filter(user -> "TECHNICIAN".equals(user.getRole()))
            .collect(Collectors.toList());
        
        List<Map<String, Object>> techList = technicians.stream()
            .map(tech -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", tech.getId());
                map.put("name", tech.getName());
                map.put("email", tech.getEmail());
                return map;
            })
            .collect(Collectors.toList());
        return Map.of("success", true, "technicians", techList);
    }

    // ========== ASSIGN TECHNICIAN ==========
    // Admin/Super Admin only
    @Transactional
    public Map<String, Object> assign(Long id, Map<String, Object> body) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        // Cannot assign to closed or rejected tickets
        if (List.of("CLOSED", "REJECTED").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation("Cannot assign technician to a " + ticket.getStatus() + " ticket.");
        }

        Long assigneeId = Long.valueOf(body.get("assigneeId").toString());
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new TicketException.AccessDenied("Technician not found."));

        // Verify assignee is actually a technician
        if (!"TECHNICIAN".equals(assignee.getRole())) {
            throw new TicketException.InvalidOperation("Can only assign tickets to users with TECHNICIAN role.");
        }

        ticket.setAssignee(assignee);
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.setStatus("ASSIGNED");

        IncidentTicket updated = ticketRepository.save(ticket);
        return Map.of("success", true, "message", "Technician assigned successfully.", "ticket", toTicketMap(updated));
    }

    // ========== SELF ASSIGN TECHNICIAN ==========
    @Transactional
    public Map<String, Object> selfAssign(Long id, User technician) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
        
        // Can only self-assign OPEN tickets that are unassigned
        if (!List.of("OPEN").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation("Cannot self-assign a ticket with status: " + ticket.getStatus());
        }
        
        if (ticket.getAssignee() != null) {
            throw new TicketException.InvalidOperation("This ticket is already assigned to another technician.");
        }
        
        ticket.setAssignee(technician);
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.setStatus("ASSIGNED");
        
        IncidentTicket updated = ticketRepository.save(ticket);
        return Map.of("success", true, "message", "You have been assigned to this ticket.", "ticket", toTicketMap(updated));
    }

    // ========== UPDATE STATUS ==========
    @Transactional
    public Map<String, Object> updateStatus(Long id, Map<String, Object> body, User caller) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        String newStatus = (String) body.get("status");
        boolean isAdminUser = isAdmin(caller);
        boolean isTechnicianUser = isTechnician(caller);
        boolean isAssignedTech = ticket.getAssignee() != null && ticket.getAssignee().getId().equals(caller.getId());

        // Permission check
        if (!isAdminUser && !(isTechnicianUser && isAssignedTech)) {
            throw new TicketException.AccessDenied("Not authorized to update this ticket.");
        }

        // Technician can only update assigned tickets with specific transitions
        if (isTechnicianUser && !isAdminUser) {
            // Technician can only: ASSIGNED → IN_PROGRESS → RESOLVED
            String currentStatus = ticket.getStatus();
            boolean validTransition = false;
            
            if ("ASSIGNED".equals(currentStatus) && "IN_PROGRESS".equals(newStatus)) {
                validTransition = true;
            } else if ("IN_PROGRESS".equals(currentStatus) && "RESOLVED".equals(newStatus)) {
                validTransition = true;
                // Auto-set resolved time
                ticket.setResolvedAt(LocalDateTime.now());
            }
            
            if (!validTransition) {
                throw new TicketException.InvalidOperation(
                    "Technicians can only change status from ASSIGNED to IN_PROGRESS, or IN_PROGRESS to RESOLVED.");
            }
        }

        // Admin/Super Admin can set any status
        ticket.setStatus(newStatus);
        
        if (body.containsKey("resolutionNotes")) {
            ticket.setResolutionNotes((String) body.get("resolutionNotes"));
        }
        
        if ("RESOLVED".equals(newStatus) && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        IncidentTicket updated = ticketRepository.save(ticket);
        return Map.of("success", true, "message", "Status updated to " + newStatus, "ticket", toTicketMap(updated));
    }

    // ========== REJECT TICKET ==========
    // Admin/Super Admin only
    @Transactional
    public Map<String, Object> rejectTicket(Long id, Map<String, Object> body) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        if (!List.of("OPEN", "ASSIGNED", "IN_PROGRESS").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation("Only OPEN, ASSIGNED or IN_PROGRESS tickets can be rejected.");
        }

        String reason = (String) body.get("rejectionReason");
        if (reason == null || reason.isBlank()) {
            throw new TicketException.InvalidOperation("Rejection reason is required.");
        }

        ticket.setStatus("REJECTED");
        ticket.setRejectionReason(reason);
        
        IncidentTicket updated = ticketRepository.save(ticket);
        return Map.of("success", true, "message", "Ticket rejected.", "ticket", toTicketMap(updated));
    }

    // ========== ADD COMMENT ==========
    @Transactional
    public Map<String, Object> addComment(Long ticketId, String content, User author) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(ticketId));

        // Cannot add comments to closed or rejected tickets
        if (List.of("CLOSED", "REJECTED").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation("Cannot add comments to a " + ticket.getStatus() + " ticket.");
        }

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setContent(content);
        comment.setIsEdited(false);
        comment.setIsDeleted(false);
        commentRepository.save(comment);
        
        return Map.of("success", true, "message", "Comment added successfully", "comment", toCommentMap(comment));
    }

    // ========== GET COMMENTS ==========
    @Transactional(readOnly = true)
    public Map<String, Object> getComments(Long ticketId, User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);
        enforceReadAccess(ticket, caller);

        List<Map<String, Object>> comments = commentRepository
                .findByTicket_IdAndIsDeletedFalseOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toCommentMap)
                .collect(Collectors.toList());

        return Map.of("success", true, "comments", comments);
    }

    // ========== EDIT COMMENT ==========
    // Owner only
    @Transactional
    public Map<String, Object> editComment(Long ticketId, Long commentId, Map<String, String> body, User caller) {
        getTicketOrThrow(ticketId);

        TicketComment comment = commentRepository.findByIdAndAuthor_Id(commentId, caller.getId())
                .orElseThrow(() -> new TicketException.AccessDenied("You can only edit your own comments."));

        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new TicketException.InvalidOperation("Cannot edit a deleted comment.");
        }

        String newContent = body.get("content");
        if (newContent == null || newContent.isBlank()) {
            throw new TicketException.InvalidOperation("Comment content cannot be empty.");
        }

        comment.setContent(newContent);
        comment.setIsEdited(true);
        commentRepository.save(comment);

        return Map.of("success", true, "message", "Comment updated.", "comment", toCommentMap(comment));
    }

    // ========== DELETE COMMENT ==========
    // Owner or Admin/Super Admin (soft delete)
    @Transactional
    public Map<String, Object> deleteComment(Long ticketId, Long commentId, User caller) {
        getTicketOrThrow(ticketId);

        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException(commentId));

        boolean isOwner = comment.getAuthor().getId().equals(caller.getId());
        boolean isAdminUser = isAdmin(caller);

        if (!isOwner && !isAdminUser) {
            throw new TicketException.AccessDenied("You do not have permission to delete this comment.");
        }

        comment.setIsDeleted(true);
        commentRepository.save(comment);

        return Map.of("success", true, "message", "Comment deleted.");
    }

    // ========== DELETE TICKET ==========
    // Super Admin only
    @Transactional
    public Map<String, Object> deleteTicket(Long id) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
        
        // Delete associated files from storage
        for (TicketAttachment attachment : ticket.getAttachments()) {
            fileStorageService.deleteFile(attachment.getFileUrl());
        }
        
        ticketRepository.delete(ticket);
        return Map.of("success", true, "message", "Ticket deleted successfully.");
    }

    // ========== ADD ATTACHMENT ==========
    @Transactional
    public Map<String, Object> addAttachment(Long ticketId, MultipartFile file, User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);
        enforceWriteAccess(ticket, caller);

        long existingCount = attachmentRepository.countByTicket_Id(ticketId);
        if (existingCount >= MAX_ATTACHMENTS) {
            throw new TicketException.InvalidOperation("Maximum " + MAX_ATTACHMENTS + " attachments allowed per ticket.");
        }

        String fileUrl = fileStorageService.storeAttachment(file);
        
        TicketAttachment attachment = new TicketAttachment();
        attachment.setTicket(ticket);
        attachment.setFileUrl(fileUrl);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachmentRepository.save(attachment);

        return Map.of("success", true, "message", "Attachment added.");
    }

    // ========== DELETE ATTACHMENT ==========
    @Transactional
    public Map<String, Object> deleteAttachment(Long ticketId, Long attachmentId, User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);
        enforceWriteAccess(ticket, caller);

        TicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(attachmentId));

        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new TicketException.AccessDenied("Attachment does not belong to this ticket.");
        }

        fileStorageService.deleteFile(attachment.getFileUrl());
        attachmentRepository.delete(attachment);

        return Map.of("success", true, "message", "Attachment deleted.");
    }

    // ========== USER DELETION SUPPORT (To prevent foreign key constraint violations) ==========
    // These methods help when deleting a user who is assigned as a technician
    
    /**
     * Check if a user is assigned as a technician to any tickets
     * @param userId The ID of the user to check
     * @return true if the user is assigned to at least one ticket
     */
    @Transactional(readOnly = true)
    public boolean isUserAssignedToTickets(Long userId) {
        return ticketRepository.countByAssignee_Id(userId) > 0;
    }

    /**
     * Get the count of tickets assigned to a user
     * @param userId The ID of the user
     * @return Number of tickets assigned to this user
     */
    @Transactional(readOnly = true)
    public long countTicketsAssignedToUser(Long userId) {
        return ticketRepository.countByAssignee_Id(userId);
    }

    /**
     * Unassign a user from all tickets (set assignee_id to NULL)
     * This should be called BEFORE deleting a user to avoid foreign key constraint violations
     * @param userId The ID of the user to unassign
     */
    @Transactional
    public void unassignUserFromAllTickets(Long userId) {
        List<IncidentTicket> tickets = ticketRepository.findAllByAssignee_Id(userId);
        
        for (IncidentTicket ticket : tickets) {
            ticket.setAssignee(null);
            ticket.setAssignedAt(null);
            // If the ticket was ASSIGNED or IN_PROGRESS and becomes unassigned, revert to OPEN
            if (List.of("ASSIGNED", "IN_PROGRESS").contains(ticket.getStatus())) {
                ticket.setStatus("OPEN");
            }
            ticketRepository.save(ticket);
        }
    }

    /**
     * Get all tickets assigned to a user (useful for displaying before deletion)
     * @param userId The ID of the user
     * @return List of tickets assigned to this user
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTicketsAssignedToUser(Long userId) {
        List<IncidentTicket> tickets = ticketRepository.findAllByAssignee_Id(userId);
        return tickets.stream().map(this::toTicketMap).collect(Collectors.toList());
    }

    // ========== HELPERS ==========
    
    private IncidentTicket getTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    private void enforceReadAccess(IncidentTicket ticket, User caller) {
        if (isAdmin(caller)) return;
        if (isTechnician(caller)) {
            // Technician can see assigned tickets OR unassigned OPEN tickets
            if (ticket.getAssignee() != null && ticket.getAssignee().getId().equals(caller.getId())) return;
            if (ticket.getAssignee() == null && List.of("OPEN").contains(ticket.getStatus())) return;
        }
        if (!ticket.getReporter().getId().equals(caller.getId())) {
            throw new TicketException.AccessDenied("You do not have access to this ticket.");
        }
    }

    private void enforceWriteAccess(IncidentTicket ticket, User caller) {
        if (isAdmin(caller)) return;
        if (!ticket.getReporter().getId().equals(caller.getId())) {
            throw new TicketException.AccessDenied("You do not have permission to modify this ticket.");
        }
    }

    private boolean isAdmin(User user) {
        return user != null && ("ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()));
    }

    private boolean isTechnician(User user) {
        return user != null && "TECHNICIAN".equals(user.getRole());
    }

    // ========== MAPPERS ==========
    
    private Map<String, Object> toTicketMap(IncidentTicket t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("category", t.getCategory());
        map.put("description", t.getDescription());
        map.put("priority", t.getPriority());
        map.put("contactDetails", t.getContactDetails());
        map.put("status", t.getStatus());
        map.put("resolutionNotes", t.getResolutionNotes());
        map.put("rejectionReason", t.getRejectionReason());
        map.put("assignedAt", t.getAssignedAt());
        map.put("resolvedAt", t.getResolvedAt());
        map.put("createdAt", t.getCreatedAt());
        map.put("updatedAt", t.getUpdatedAt());
        
        // Reporter info
        if (t.getReporter() != null) {
            map.put("reporter", t.getReporter().getName());
            map.put("reporterId", t.getReporter().getId());
        }
        
        // Assignee info
        if (t.getAssignee() != null) {
            map.put("assignee", t.getAssignee().getName());
            map.put("assigneeId", t.getAssignee().getId());
        }
        
        // Resource info
        if (t.getResource() != null) {
            Map<String, Object> resource = new LinkedHashMap<>();
            resource.put("id", t.getResource().getId());
            resource.put("name", t.getResource().getName());
            resource.put("location", t.getResource().getLocation());
            map.put("resource", resource);
        }
        
        // Attachments
        List<Map<String, Object>> attachments = new ArrayList<>();
        if (t.getAttachments() != null) {
            for (TicketAttachment a : t.getAttachments()) {
                Map<String, Object> att = new LinkedHashMap<>();
                att.put("id", a.getId());
                att.put("fileUrl", a.getFileUrl());
                att.put("fileName", a.getFileName());
                att.put("fileType", a.getFileType());
                att.put("fileSize", a.getFileSize());
                att.put("uploadedAt", a.getUploadedAt());
                attachments.add(att);
            }
        }
        map.put("attachments", attachments);
        
        // Comments count
        map.put("commentsCount", t.getComments() != null ? t.getComments().size() : 0);
        
        return map;
    }

    private Map<String, Object> toCommentMap(TicketComment c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("ticketId", c.getTicket().getId());
        map.put("content", c.getContent());
        map.put("isEdited", c.getIsEdited());
        map.put("isDeleted", c.getIsDeleted());
        map.put("createdAt", c.getCreatedAt());
        map.put("updatedAt", c.getUpdatedAt());
        
        if (c.getAuthor() != null) {
            Map<String, Object> author = new LinkedHashMap<>();
            author.put("id", c.getAuthor().getId());
            author.put("name", c.getAuthor().getName());
            author.put("role", c.getAuthor().getRole());
            map.put("author", author);
        }
        
        return map;
    }
}