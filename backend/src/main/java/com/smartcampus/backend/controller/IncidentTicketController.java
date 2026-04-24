package com.smartcampus.backend.controller;

import com.smartcampus.backend.exception.TicketException;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.IncidentTicketService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class IncidentTicketController {

    private final IncidentTicketService ticketService;
    private final UserRepository userRepository;

    public IncidentTicketController(IncidentTicketService ticketService,
                                    UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    // ========== CREATE TICKET ==========
    // User, Admin, Super Admin can create (Technician cannot)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createTicket(
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("priority") String priority,
            @RequestParam(value = "contactDetails", required = false) String contactDetails,
            @RequestParam(value = "resourceId", required = false) Long resourceId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        
        // Technician cannot create tickets
        if ("TECHNICIAN".equals(caller.getRole())) {
            throw new TicketException.AccessDenied("Technicians cannot create tickets. Only Users, Admins, and Super Admins can.");
        }
        
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("category", category);
        body.put("description", description);
        body.put("priority", priority);
        if (contactDetails != null) body.put("contactDetails", contactDetails);
        if (resourceId != null) body.put("resourceId", resourceId);

        Map<String, Object> result = ticketService.create(body, files, caller.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ========== GET TICKETS ==========
    // Role-based filtering handled in service
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Map<String, Object> result = ticketService.getAll(status, priority, pageable, caller);
        return ResponseEntity.ok(result);
    }

    // ========== GET SINGLE TICKET ==========
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTicketById(
            @PathVariable Long id,
            HttpServletRequest request) {
        
        User caller = getSessionUser(request);
        Map<String, Object> result = ticketService.getTicketById(id, caller);
        return ResponseEntity.ok(result);
    }

    // ========== ASSIGN TECHNICIAN ==========
    // Admin and Super Admin only
    @PatchMapping("/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            throw new TicketException.AccessDenied("Only Admins and Super Admins can assign tickets.");
        }

        Map<String, Object> result = ticketService.assign(id, body);
        return ResponseEntity.ok(result);
    }

    // ========== UPDATE STATUS ==========
    // Admin/Super Admin can change any status
    // Technician can only resolve assigned tickets (OPEN → IN_PROGRESS → RESOLVED)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        
        // Check if user has permission to update status
        boolean isAdminUser = isAdmin(caller);
        boolean isTechnicianUser = "TECHNICIAN".equals(caller.getRole());
        
        if (!isAdminUser && !isTechnicianUser) {
            throw new TicketException.AccessDenied("Only Admins, Super Admins, or Technicians can update ticket status.");
        }
        
        // For technicians, additional validation will be done in service
        Map<String, Object> result = ticketService.updateStatus(id, body, caller);
        return ResponseEntity.ok(result);
    }

    // ========== REJECT TICKET ==========
    // Admin and Super Admin only
    @PatchMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            throw new TicketException.AccessDenied("Only Admins and Super Admins can reject tickets.");
        }

        Map<String, Object> result = ticketService.rejectTicket(id, body);
        return ResponseEntity.ok(result);
    }

    // ========== ADD COMMENT ==========
    // All authenticated users can add comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        User author = getSessionUser(request);
        String content = body.get("content");
        
        Map<String, Object> result = ticketService.addComment(id, content, author);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ========== GET COMMENTS ==========
    @GetMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> getComments(
            @PathVariable Long id,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Map<String, Object> result = ticketService.getComments(id, caller);
        return ResponseEntity.ok(result);
    }

    // ========== EDIT COMMENT ==========
    // Comment owner only
    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> editComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Map<String, Object> result = ticketService.editComment(ticketId, commentId, body, caller);
        return ResponseEntity.ok(result);
    }

    // ========== DELETE COMMENT ==========
    // Comment owner or Admin/Super Admin (soft delete)
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Map<String, Object> result = ticketService.deleteComment(ticketId, commentId, caller);
        return ResponseEntity.ok(result);
    }

    // ========== DELETE TICKET ==========
    // Super Admin only
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTicket(
            @PathVariable Long id,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        if (!"SUPER_ADMIN".equals(caller.getRole())) {
            throw new TicketException.AccessDenied("Only Super Admins can delete tickets.");
        }

        Map<String, Object> result = ticketService.deleteTicket(id);
        return ResponseEntity.ok(result);
    }

    // ========== ADD ATTACHMENT ==========
    @PostMapping("/{id}/attachments")
    public ResponseEntity<Map<String, Object>> addAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Map<String, Object> result = ticketService.addAttachment(id, file, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ========== DELETE ATTACHMENT ==========
    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<Map<String, Object>> deleteAttachment(
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Map<String, Object> result = ticketService.deleteAttachment(ticketId, attachmentId, caller);
        return ResponseEntity.ok(result);
    }

    // ========== HELPERS ==========
    private User getSessionUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new TicketException.AccessDenied("You must be logged in.");
        }
        Long userId = (Long) session.getAttribute("userId");
        return userRepository.findById(userId)
                .orElseThrow(() -> new TicketException.AccessDenied("Session user not found."));
    }

    private boolean isAdmin(User user) {
        return user != null && ("ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()));
    }
}