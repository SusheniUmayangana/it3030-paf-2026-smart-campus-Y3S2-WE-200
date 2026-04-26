package com.smartcampus.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;

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

   
    @GetMapping("/user-stats/{userId}")
    public ResponseEntity<Map<String, Long>> getUserStats(@PathVariable Long userId) {
        long myBookings = bookingRepository.countByUserId(userId);

        return ResponseEntity.ok(Map.of(
                "myBookings", myBookings
        ));
    }
}
