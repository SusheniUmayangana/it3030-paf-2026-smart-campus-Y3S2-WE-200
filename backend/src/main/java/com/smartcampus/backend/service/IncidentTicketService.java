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

    public Map<String, Object> getAll(String status, String priority, Pageable pageable, User caller) {
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
        response.put("tickets", page.getContent().stream().map(this::toTicketMap).toList());
        return response;
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body, List<MultipartFile> files, Long reporterId) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException(reporterId));

        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle((String) body.get("title"));
        ticket.setCategory((String) body.get("category"));
        ticket.setDescription((String) body.get("description"));
        ticket.setPriority((String) body.get("priority"));
        if (body.containsKey("contactDetails")) {
            ticket.setContactDetails((String) body.get("contactDetails"));
        }
        if (body.containsKey("resourceId")) {
            Long resId = Long.valueOf(body.get("resourceId").toString());
            Resource resource = resourceRepository.findById(resId).orElse(null);
            ticket.setResource(resource);
        }
        ticket.setReporter(reporter);
        ticket.setStatus("OPEN");

        IncidentTicket saved = ticketRepository.save(ticket);

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String fileUrl = fileStorageService.storeAttachment(file);
                TicketAttachment attachment = new TicketAttachment();
                attachment.setTicket(saved);
                attachment.setFileUrl(fileUrl);
                attachment.setFileName(file.getOriginalFilename());
                attachmentRepository.save(attachment);
            }
        }
        return Map.of("success", true, "ticket", toTicketMap(saved));
    }

    @Transactional
    public Map<String, Object> assign(Long id, Map<String, Object> body) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        Long assigneeId = Long.valueOf(body.get("assigneeId").toString());
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new TicketException.AccessDenied("Technician not found."));

        ticket.setAssignee(assignee);
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.setStatus("IN_PROGRESS");

        IncidentTicket updated = ticketRepository.save(ticket);
        return Map.of("success", true, "ticket", toTicketMap(updated));
    }

    @Transactional
    public Map<String, Object> updateStatus(Long id, Map<String, Object> body, User caller) {
        IncidentTicket existing = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        boolean isAssigned = existing.getAssignee() != null && existing.getAssignee().getId().equals(caller.getId());
        if (!isAdmin(caller) && !isAssigned) {
            throw new TicketException.AccessDenied("Not authorized to update this ticket.");
        }

        existing.setStatus((String) body.get("status"));
        if (body.containsKey("resolutionNotes")) {
            existing.setResolutionNotes((String) body.get("resolutionNotes"));
        }
        if ("REJECTED".equals(body.get("status")) && body.containsKey("rejectionReason")) {
            existing.setRejectionReason((String) body.get("rejectionReason"));
        }

        IncidentTicket updated = ticketRepository.save(existing);
        return Map.of("success", true, "ticket", toTicketMap(updated));
    }

    @Transactional
    public Map<String, Object> addComment(Long ticketId, String content, User author) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(ticketId));

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setContent(content);
        comment.setCreatedAt(LocalDateTime.now());

        commentRepository.save(comment);
        
        return Map.of("success", true, "message", "Comment added successfully");
    }

    public Map<String, Object> getById(Long id) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
        return Map.of("success", true, "ticket", toFullTicketMap(ticket));
    }

    @Transactional
    public Map<String, Object> editComment(Long commentId, String content, User caller) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException(commentId));

        if (!comment.getAuthor().getId().equals(caller.getId()) && !isAdmin(caller)) {
            throw new TicketException.AccessDenied("Not authorized to edit this comment.");
        }

        comment.setContent(content);
        comment.setIsEdited(true);
        commentRepository.save(comment);

        return Map.of("success", true, "message", "Comment updated successfully");
    }

    @Transactional
    public Map<String, Object> deleteComment(Long commentId, User caller) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException(commentId));

        if (!comment.getAuthor().getId().equals(caller.getId()) && !isAdmin(caller)) {
            throw new TicketException.AccessDenied("Not authorized to delete this comment.");
        }

        comment.setIsDeleted(true);
        commentRepository.save(comment);

        return Map.of("success", true, "message", "Comment deleted successfully");
    }

    private boolean isAdmin(User user) {
        return user != null && (user.getRole().equals("ADMIN") || user.getRole().equals("SUPER_ADMIN"));
    }

    private boolean isTechnician(User user) {
        return user != null && user.getRole().equals("TECHNICIAN");
    }

    private Map<String, Object> toTicketMap(IncidentTicket t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("status", t.getStatus());
        map.put("priority", t.getPriority());
        if (t.getAssignee() != null) map.put("assignee", t.getAssignee().getName());
        return map;
    }

    private Map<String, Object> toFullTicketMap(IncidentTicket t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("description", t.getDescription());
        map.put("category", t.getCategory());
        map.put("priority", t.getPriority());
        map.put("status", t.getStatus());
        map.put("contactDetails", t.getContactDetails());
        map.put("resolutionNotes", t.getResolutionNotes());
        map.put("rejectionReason", t.getRejectionReason());
        map.put("createdAt", t.getCreatedAt());
        
        if (t.getReporter() != null) {
            map.put("reporter", t.getReporter().getName());
            map.put("reporterId", t.getReporter().getId());
        }
        if (t.getAssignee() != null) {
            map.put("assignee", t.getAssignee().getName());
            map.put("assigneeId", t.getAssignee().getId());
        }
        if (t.getResource() != null) {
            map.put("resource", Map.of("id", t.getResource().getId(), "name", t.getResource().getName()));
        }
        
        List<Map<String, Object>> attachments = t.getAttachments().stream()
            .map(a -> {
                Map<String, Object> am = new LinkedHashMap<>();
                am.put("id", a.getId());
                am.put("fileUrl", a.getFileUrl());
                am.put("fileName", a.getFileName());
                return am;
            })
            .toList();
        map.put("attachments", attachments);

        List<Map<String, Object>> comments = commentRepository.findByTicket_IdAndIsDeletedFalseOrderByCreatedAtAsc(t.getId()).stream()
            .map(c -> {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("id", c.getId());
                cm.put("content", c.getContent());
                cm.put("authorName", c.getAuthor().getName());
                cm.put("authorId", c.getAuthor().getId());
                cm.put("createdAt", c.getCreatedAt());
                cm.put("isEdited", c.getIsEdited());
                return cm;
            })
            .toList();
        map.put("comments", comments);
        
        return map;
    }
}