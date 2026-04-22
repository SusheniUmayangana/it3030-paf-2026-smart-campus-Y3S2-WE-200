package com.smartcampus.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // CHANGED: Matches User.java (Long)
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // CHANGED: Matches Resource.java (Long)
    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private String purpose;

    @Column(name = "attendees_count")
    private Integer attendeesCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = BookingStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // --- DTOs ---
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResponseDTO {
        private Long id;
        private Long userId;
        private Long resourceId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String purpose;
        private Integer attendeesCount;
        private BookingStatus status;
        private String rejectionReason;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestDTO {
        @NotNull(message = "User ID is required")
        private Long userId;
        @NotNull(message = "Resource ID is required")
        private Long resourceId;
        @NotNull(message = "Start time is required")
        private LocalDateTime startTime;
        @NotNull(message = "End time is required")
        private LocalDateTime endTime;
        @NotBlank(message = "Purpose is required")
        private String purpose;
        private Integer attendeesCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectDTO {
        @NotBlank(message = "Rejection reason is required")
        private String reason;
    }
}