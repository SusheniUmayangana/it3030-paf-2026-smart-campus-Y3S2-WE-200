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

    // UPDATED: Matches service method name 'create'
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

        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("category", category);
        body.put("description", description);
        body.put("priority", priority);
        if (contactDetails != null) body.put("contactDetails", contactDetails);
        if (resourceId != null) body.put("resourceId", resourceId);

        // Service call updated to .create()
        Map<String, Object> result = ticketService.create(body, files, caller.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // UPDATED: Matches service method name 'getAll'
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        User caller = getSessionUser(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Service call updated to .getAll()
        Map<String, Object> result = ticketService.getAll(status, priority, pageable, caller);
        return ResponseEntity.ok(result);
    }

    // UPDATED: Matches service method name 'updateStatus'
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        User caller = getSessionUser(request);

        // Security check is handled within the service, but kept here for controller-level validation
        if (!isTechnician(caller) && !isAdmin(caller)) {
            throw new TicketException.AccessDenied("Only technicians or admins can update ticket status.");
        }

        // Service call updated to .updateStatus()
        Map<String, Object> result = ticketService.updateStatus(id, body, caller);
        return ResponseEntity.ok(result);
    }

    // Helper: Validates active session and retrieves User from repository
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
        return user != null &&
                ("ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()));
    }

    private boolean isTechnician(User user) {
        return user != null && "TECHNICIAN".equals(user.getRole());
    }
}