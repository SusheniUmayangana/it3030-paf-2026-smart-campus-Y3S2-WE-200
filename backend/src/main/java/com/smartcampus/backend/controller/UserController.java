package com.smartcampus.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    
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

    

    
    @GetMapping
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (!isAdmin(caller)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Access denied."));
        }

        List<User> users = userService.getAllUsers();
        
        List<Map<String, Object>> result = users.stream().map(this::toDto).toList();
        return ResponseEntity.ok(result);
    }

    
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

    

    
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        User caller = getSessionUser(request);
        if (caller == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Not authenticated."));
        }
        return ResponseEntity.ok(toDto(caller));
    }

    
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
