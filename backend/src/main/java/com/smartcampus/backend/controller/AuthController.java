package com.smartcampus.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final List<String> ALLOWED_SIGNUP_ROLES = List.of("USER", "MANAGER", "TECHNICIAN");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");

        if (name == null || email == null || password == null ||
            name.isBlank() || email.isBlank() || password.isBlank()) {
            response.put("success", false);
            response.put("message", "Name, email, and password are required.");
            return ResponseEntity.badRequest().body(response);
        }

        if (password.length() < 6) {
            response.put("success", false);
            response.put("message", "Password must be at least 6 characters.");
            return ResponseEntity.badRequest().body(response);
        }

        
        if (role == null || role.isBlank()) {
            role = "USER";
        } else {
            role = role.toUpperCase().trim();
        }

        if (!ALLOWED_SIGNUP_ROLES.contains(role)) {
            response.put("success", false);
            response.put("message", "Invalid role. Allowed roles: User, Manager, Technician.");
            return ResponseEntity.badRequest().body(response);
        }

        if (userRepository.findByEmail(email.trim().toLowerCase()).isPresent()) {
            response.put("success", false);
            response.put("message", "An account with this email already exists.");
            return ResponseEntity.badRequest().body(response);
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(password));
        user.setProvider("local");
        user.setRole(role);

        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Account created successfully. Please sign in.");
        return ResponseEntity.ok(response);
    }

    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body,
                                                      HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();

        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null || email.isBlank() || password.isBlank()) {
            response.put("success", false);
            response.put("message", "Email and password are required.");
            return ResponseEntity.badRequest().body(response);
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);

        if (user == null) {
            response.put("success", false);
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(401).body(response);
        }

        if (user.getPassword() == null) {
            response.put("success", false);
            response.put("message", "This account uses Google sign-in. Please use the Google button.");
            return ResponseEntity.status(401).body(response);
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(401).body(response);
        }

        // Create session
        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId());

        response.put("success", true);
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("profilePicture", user.getProfilePicture());
        return ResponseEntity.ok(response);
    }

    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAuthStatus(
            @AuthenticationPrincipal OAuth2User oAuth2User,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        // Check OAuth2 user (Google login)
        if (oAuth2User != null) {
            String email = oAuth2User.getAttribute("email");
            User user = userRepository.findByEmail(email).orElse(null);

            response.put("authenticated", true);
            response.put("id", user != null ? user.getId() : null);
            response.put("name", oAuth2User.getAttribute("name"));
            response.put("email", email);
            response.put("picture", oAuth2User.getAttribute("picture"));
            response.put("role", user != null ? user.getRole() : "USER");
            return ResponseEntity.ok(response);
        }

        
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("userId") != null) {
            Long userId = (Long) session.getAttribute("userId");
            User user = userRepository.findById(userId).orElse(null);

            if (user != null) {
                response.put("authenticated", true);
                response.put("id", user.getId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("picture", user.getProfilePicture());
                response.put("role", user.getRole());
                return ResponseEntity.ok(response);
            }
        }

        response.put("authenticated", false);
        return ResponseEntity.ok(response);
    }

    
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully.");
        return ResponseEntity.ok(response);
    }
}
