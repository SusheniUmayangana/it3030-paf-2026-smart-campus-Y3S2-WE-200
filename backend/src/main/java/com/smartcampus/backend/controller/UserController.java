package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // ========== Helper: get logged-in user from session ==========
    private User getSessionUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return null;
        }
        Long userId = (Long) session.getAttribute("userId");
        return userRepository.findById(userId).orElse(null);
    }

    private boolean isAdmin(User user) {
        return user != null && ("ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()));
    }

    // ========== ADMIN ENDPOINTS ==========

    /** GET /api/users — list all users (admin/super_admin only) */
    @GetMapping
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied."));
        }

        List<User> users = userService.getAllUsers();
        // Map to safe DTOs (exclude password)
        List<Map<String, Object>> result = users.stream().map(this::toDto).toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/users/{id} — get user by ID (admin/super_admin only) */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied."));
        }

        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(toDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/users/{id} — update user (admin/super_admin only) */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied."));
        }

        try {
            User updated = userService.updateUser(id, body, caller.getRole());
            return ResponseEntity.ok(Map.of("success", true, "user", toDto(updated)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** DELETE /api/users/{id} — delete user (admin/super_admin only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied."));
        }

        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ========== SELF-PROFILE ENDPOINTS ==========

    /** GET /api/users/profile — get own profile */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (caller == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Not authenticated."));
        }
        return ResponseEntity.ok(toDto(caller));
    }

    /** PUT /api/users/profile — update own profile (name/email only) */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body,
                                           HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (caller == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Not authenticated."));
        }

        try {
            User updated = userService.updateProfile(caller.getId(), body);
            return ResponseEntity.ok(Map.of("success", true, "user", toDto(updated)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ========== DTO helper (exclude password) ==========
    private Map<String, Object> toDto(User user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("name", user.getName());
        dto.put("email", user.getEmail());
        dto.put("role", user.getRole());
        dto.put("provider", user.getProvider());
        dto.put("profilePicture", user.getProfilePicture());
        return dto;
    }
}
