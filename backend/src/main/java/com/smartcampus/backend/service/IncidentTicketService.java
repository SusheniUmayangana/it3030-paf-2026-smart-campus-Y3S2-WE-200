package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.exception.TicketException;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class IncidentTicketService {

    private final IncidentTicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;

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

    private static final int MAX_ATTACHMENTS = 3;

    // Create a new incident ticket with optional file attachments
    @Transactional
    public Map<String, Object> createTicket(Map<String, Object> body,
                                           List<MultipartFile> files,
                                           Long reporterId) {
        User reporter = getUserOrThrow(reporterId);

        if (files != null && files.size() > MAX_ATTACHMENTS) {
            throw new TicketException.InvalidOperation(
                "A ticket can have a maximum of " + MAX_ATTACHMENTS + " attachments.");
        }

        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle(getString(body, "title"));
        ticket.setCategory(getString(body, "category"));
        ticket.setDescription(getString(body, "description"));
        ticket.setPriority(getString(body, "priority"));
        ticket.setContactDetails((String) body.get("contactDetails"));
        ticket.setReporter(reporter);
        ticket.setStatus("OPEN");

        Object resourceIdObj = body.get("resourceId");
        if (resourceIdObj != null) {
            Long resourceId = Long.parseLong(resourceIdObj.toString());
            Resource resource = resourceRepository.findById(resourceId)
                    .orElseThrow(() -> new ResourceNotFoundException(resourceId));
            ticket.setResource(resource);
        }

        IncidentTicket saved = ticketRepository.save(ticket);

        if (files != null) {
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

        IncidentTicket fresh = ticketRepository.findById(saved.getId()).orElseThrow();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Ticket created successfully.");
        response.put("ticket", toTicketMap(fresh));
        return response;
    }

    // Retrieve tickets with filtering based on user role and ticket status
    @Transactional(readOnly = true)
    public Map<String, Object> getAllTickets(String status, String priority,
                                             Pageable pageable, User caller) {
        Page<IncidentTicket> page;

        if (isAdmin(caller)) {
            if (status != null && priority != null)
                page = ticketRepository.findByStatusAndPriority(status, priority, pageable);
            else if (status != null)
                page = ticketRepository.findByStatus(status, pageable);
            else if (priority != null)
                page = ticketRepository.findByPriority(priority, pageable);
            else
                page = ticketRepository.findAll(pageable);
        } else if (isTechnician(caller)) {
            page = ticketRepository.findByAssignee_Id(caller.getId(), pageable);
        } else {
            page = ticketRepository.findByReporter_Id(caller.getId(), pageable);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("currentPage", page.getNumber());
        response.put("tickets", page.getContent().stream().map(this::toTicketMap).toList());
        return response;
    }

    // Get details for a specific ticket after verifying view permissions
    @Transactional(readOnly = true)
    public Map<String, Object> getTicketById(Long ticketId, User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);
        enforceReadAccess(ticket, caller);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("ticket", toTicketMap(ticket));
        return response;
    }

    // Assign a technician and move ticket status to IN_PROGRESS
    @Transactional
    public Map<String, Object> assignTechnician(Long ticketId, Map<String, Object> body) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);

        if (List.of("RESOLVED", "CLOSED", "REJECTED").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation(
                "Cannot assign a technician to a ticket with status: " + ticket.getStatus());
        }

        Long assigneeId = Long.parseLong(body.get("assigneeId").toString());
        User technician = getUserOrThrow(assigneeId);

        ticket.setAssignee(technician);
        ticket.setStatus("IN_PROGRESS");
        ticket.setAssignedAt(LocalDateTime.now());

        ticketRepository.save(ticket);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Technician assigned successfully.");
        response.put("ticket", toTicketMap(ticket));
        return response;
    }

    // Update status and add notes for the maintenance workflow
    @Transactional
    public Map<String, Object> updateTicketStatus(Long ticketId,
                                                   Map<String, Object> body,
                                                   User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);

        boolean isAssignedTech = ticket.getAssignee() != null
                && ticket.getAssignee().getId().equals(caller.getId());

        if (!isAssignedTech && !isAdmin(caller)) {
            throw new TicketException.AccessDenied("You are not assigned to this ticket.");
        }

        String newStatus = getString(body, "status");
        validateStatusTransition(ticket.getStatus(), newStatus);
        ticket.setStatus(newStatus);

        Object notes = body.get("resolutionNotes");
        if (notes != null && !notes.toString().isBlank()) {
            ticket.setResolutionNotes(notes.toString().trim());
        }

        if ("RESOLVED".equals(newStatus)) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        ticketRepository.save(ticket);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Status updated to " + newStatus + ".");
        response.put("ticket", toTicketMap(ticket));
        return response;
    }

    // Reject a ticket and provide a mandatory reason for the rejection
    @Transactional
    public Map<String, Object> rejectTicket(Long ticketId, Map<String, Object> body) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);

        if (!List.of("OPEN", "IN_PROGRESS").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation(
                "Only OPEN or IN_PROGRESS tickets can be rejected.");
        }

        String reason = getString(body, "rejectionReason");
        ticket.setStatus("REJECTED");
        ticket.setRejectionReason(reason);
        ticketRepository.save(ticket);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Ticket rejected.");
        response.put("ticket", toTicketMap(ticket));
        return response;
    }

    // Add a comment to a ticket while checking for closed status
    @Transactional
    public Map<String, Object> addComment(Long ticketId, Map<String, Object> body, User caller) {
        IncidentTicket ticket = getTicketOrThrow(ticketId);
        enforceReadAccess(ticket, caller);

        if (List.of("CLOSED", "REJECTED").contains(ticket.getStatus())) {
            throw new TicketException.InvalidOperation(
                "Cannot add comments to a " + ticket.getStatus() + " ticket.");
        }

        String content = getString(body, "content");

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(caller);
        comment.setContent(content);
        comment.setIsEdited(false);
        comment.setIsDeleted(false);
        commentRepository.save(comment);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Comment added.");
        response.put("comment", toCommentMap(comment));
        return response;
    }

    // Internal helper to find a ticket or throw Not Found
    private IncidentTicket getTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    // Internal helper to find a user or throw Not Found
    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    // Validate if the status transition follows the prescribed workflow
    private void validateStatusTransition(String current, String next) {
        boolean valid = switch (current) {
            case "OPEN"        -> "IN_PROGRESS".equals(next);
            case "IN_PROGRESS" -> "RESOLVED".equals(next) || "CLOSED".equals(next);
            case "RESOLVED"    -> "CLOSED".equals(next);
            default            -> false;
        };
        if (!valid) {
            throw new TicketException.InvalidOperation(
                "Invalid status transition from '" + current + "' to '" + next + "'.");
        }
    }

    // Enforce read permissions based on ownership or role
    private void enforceReadAccess(IncidentTicket ticket, User caller) {
        if (isAdmin(caller) || isTechnician(caller)) return;
        if (!ticket.getReporter().getId().equals(caller.getId())) {
            throw new TicketException.AccessDenied("You do not have access to this ticket.");
        }
    }

    // Check if the user has administrative roles
    private boolean isAdmin(User user) {
        return user != null && 
               (user.getRole().equals("ADMIN") || user.getRole().equals("SUPER_ADMIN"));
    }

    // Check if the user is a technician
    private boolean isTechnician(User user) {
        return user != null && user.getRole().equals("TECHNICIAN");
    }

    // Safely extract a required string from the request body
    private String getString(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val == null || val.toString().isBlank()) {
            throw new TicketException.InvalidOperation("Field '" + key + "' is required.");
        }
        return val.toString().trim();
    }

    // Map the incident ticket entity to a clean map structure for the API
    public Map<String, Object> toTicketMap(IncidentTicket t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("category", t.getCategory());
        map.put("status", t.getStatus());
        map.put("priority", t.getPriority());
        map.put("createdAt", t.getCreatedAt());
        map.put("reporter", toUserMap(t.getReporter()));
        map.put("assignee", t.getAssignee() != null ? toUserMap(t.getAssignee()) : null);
        return map;
    }

    // Map user data to a safe format without exposing sensitive details
    private Map<String, Object> toUserMap(User u) {
        if (u == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("role", u.getRole());
        return map;
    }

    // Map comment entity to a response format
    public Map<String, Object> toCommentMap(TicketComment c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("content", c.getContent());
        map.put("author", toUserMap(c.getAuthor()));
        map.put("createdAt", c.getCreatedAt());
        return map;
    }
}