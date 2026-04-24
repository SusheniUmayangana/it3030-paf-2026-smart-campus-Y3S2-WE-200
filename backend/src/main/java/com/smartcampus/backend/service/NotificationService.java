package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.NotificationType;
import com.smartcampus.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Create and persist a new notification.
     */
    public Notification.ResponseDTO createNotification(Long recipientId, NotificationType type,
                                                        String title, String message, Long bookingId) {
        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .type(type)
                .title(title)
                .message(message)
                .bookingId(bookingId)
                .build();

        return toDTO(notificationRepository.save(notification));
    }

    /**
     * Get all notifications for a user, newest first.
     */
    public List<Notification.ResponseDTO> getNotificationsForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).toList();
    }

    /**
     * Get unread notification count for the navbar badge.
     */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /**
     * Mark a single notification as read.
     */
    public Notification.ResponseDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        notification.setRead(true);
        return toDTO(notificationRepository.save(notification));
    }

    /**
     * Mark all notifications for a user as read.
     */
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    /**
     * Delete a single notification.
     */
    public void deleteNotification(Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new RuntimeException("Notification not found: " + notificationId);
        }
        notificationRepository.deleteById(notificationId);
    }

    private Notification.ResponseDTO toDTO(Notification n) {
        return Notification.ResponseDTO.builder()
                .id(n.getId())
                .recipientId(n.getRecipientId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .bookingId(n.getBookingId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
