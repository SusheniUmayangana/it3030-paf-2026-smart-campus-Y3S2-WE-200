package com.smartcampus.backend.controller;

import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public DashboardController(ResourceRepository resourceRepository,
                               BookingRepository bookingRepository,
                               UserRepository userRepository) {
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/dashboard/admin-stats
     * Returns total facilities, bookings, and users count.
     * Intended for ADMIN and SUPER_ADMIN roles (authorization enforced on the frontend).
     */
    @GetMapping("/admin-stats")
    public ResponseEntity<Map<String, Long>> getAdminStats() {
        long totalFacilities = resourceRepository.count();
        long totalBookings = bookingRepository.count();
        long totalUsers = userRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalFacilities", totalFacilities,
                "totalBookings", totalBookings,
                "totalUsers", totalUsers
        ));
    }

    /**
     * GET /api/dashboard/user-stats/{userId}
     * Returns the booking count for a specific user.
     * Used by USER, MANAGER, and TECHNICIAN roles.
     */
    @GetMapping("/user-stats/{userId}")
    public ResponseEntity<Map<String, Long>> getUserStats(@PathVariable Long userId) {
        long myBookings = bookingRepository.countByUserId(userId);

        return ResponseEntity.ok(Map.of(
                "myBookings", myBookings
        ));
    }
}
