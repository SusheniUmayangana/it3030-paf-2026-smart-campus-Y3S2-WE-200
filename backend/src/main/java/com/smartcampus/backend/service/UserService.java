package com.smartcampus.backend.service;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Admin/Super-admin updates another user's details.
     * Only SUPER_ADMIN can set role to ADMIN.
     */
    public User updateUser(Long id, Map<String, String> body, String callerRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (body.containsKey("name") && body.get("name") != null && !body.get("name").isBlank()) {
            user.setName(body.get("name").trim());
        }
        if (body.containsKey("email") && body.get("email") != null && !body.get("email").isBlank()) {
            user.setEmail(body.get("email").trim().toLowerCase());
        }
        if (body.containsKey("role") && body.get("role") != null) {
            String newRole = body.get("role").toUpperCase().trim();
            // Only SUPER_ADMIN can assign ADMIN or SUPER_ADMIN roles
            if ("ADMIN".equals(newRole) || "SUPER_ADMIN".equals(newRole)) {
                if (!"SUPER_ADMIN".equals(callerRole)) {
                    throw new RuntimeException("Only SUPER_ADMIN can assign ADMIN role.");
                }
            }
            user.setRole(newRole);
        }

        return userRepository.save(user);
    }

    /**
     * A user updates their own profile (name and email only — not role).
     */
    public User updateProfile(Long id, Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (body.containsKey("name") && body.get("name") != null && !body.get("name").isBlank()) {
            user.setName(body.get("name").trim());
        }
        if (body.containsKey("email") && body.get("email") != null && !body.get("email").isBlank()) {
            user.setEmail(body.get("email").trim().toLowerCase());
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
