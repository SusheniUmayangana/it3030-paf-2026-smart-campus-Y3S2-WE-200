package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.BookingNotFoundException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.NotificationType;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;

    @Override
    public Booking.ResponseDTO createBooking(Booking.RequestDTO dto) {
        validateBookingTimes(dto.getStartTime(), dto.getEndTime());
        checkConflicts(dto.getResourceId(), dto.getStartTime(), dto.getEndTime(), null);

        Booking booking = Booking.builder()
            .userId(dto.getUserId())
            .resourceId(dto.getResourceId())
            .startTime(dto.getStartTime())
            .endTime(dto.getEndTime())
            .purpose(dto.getPurpose())
            .attendeesCount(dto.getAttendeesCount())
            .status(BookingStatus.PENDING)
            .build();

        Booking saved = bookingRepository.save(booking);

        // --- Notify all admins about the new booking ---
        String userName = userRepository.findById(dto.getUserId())
                .map(User::getName).orElse("A user");
        String resourceName = resourceRepository.findById(dto.getResourceId())
                .map(Resource::getName).orElse("Resource #" + dto.getResourceId());

        List<User> admins = new ArrayList<>();
        admins.addAll(userRepository.findByRole("ADMIN"));
        admins.addAll(userRepository.findByRole("SUPER_ADMIN"));
        admins.addAll(userRepository.findByRole("SUPER ADMIN"));

        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    NotificationType.BOOKING_CREATED,
                    "New Booking Request",
                    userName + " requested to book \"" + resourceName + "\" on "
                            + dto.getStartTime().toLocalDate() + ".",
                    saved.getId()
            );
        }

        return toDTO(saved);
    }

    @Override
    public Booking.ResponseDTO updateBooking(Long id, Booking.RequestDTO dto) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));

        // Logic: Only PENDING bookings can be updated
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be updated. Current status: " + booking.getStatus());
        }

        validateBookingTimes(dto.getStartTime(), dto.getEndTime());
        // Check conflicts but ignore this specific booking ID
        checkConflicts(dto.getResourceId(), dto.getStartTime(), dto.getEndTime(), id);

        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());
        booking.setAttendeesCount(dto.getAttendeesCount());

        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));

        // Logic: Only PENDING bookings can be deleted by the user
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Cannot delete a booking that has already been " + booking.getStatus());
        }
        
        bookingRepository.deleteById(id);
    }

    @Override
    public Booking.ResponseDTO approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));
            
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be approved.");
        }

        booking.setStatus(BookingStatus.APPROVED);
        Booking saved = bookingRepository.save(booking);

        // --- Notify the booking owner ---
        String resourceName = resourceRepository.findById(booking.getResourceId())
                .map(Resource::getName).orElse("Resource #" + booking.getResourceId());

        notificationService.createNotification(
                booking.getUserId(),
                NotificationType.BOOKING_APPROVED,
                "Booking Approved",
                "Your booking for \"" + resourceName + "\" on "
                        + booking.getStartTime().toLocalDate() + " has been approved.",
                saved.getId()
        );

        return toDTO(saved);
    }

    @Override
    public Booking.ResponseDTO rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected.");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);

        // --- Notify the booking owner ---
        String resourceName = resourceRepository.findById(booking.getResourceId())
                .map(Resource::getName).orElse("Resource #" + booking.getResourceId());

        notificationService.createNotification(
                booking.getUserId(),
                NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                "Your booking for \"" + resourceName + "\" on "
                        + booking.getStartTime().toLocalDate()
                        + " has been rejected. Reason: " + reason,
                saved.getId()
        );

        return toDTO(saved);
    }

    @Override
    public Booking.ResponseDTO cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED bookings can be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public Booking.ResponseDTO getBookingById(Long id) {
        return toDTO(bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id)));
    }

    @Override
    public List<Booking.ResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    public List<Booking.ResponseDTO> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<Booking.ResponseDTO> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status).stream().map(this::toDTO).toList();
    }

    @Override
    public List<Booking.ResponseDTO> getBookingsByResource(Long resourceId) {
        return bookingRepository.findByResourceId(resourceId).stream().map(this::toDTO).toList();
    }

    // --- Private Helper Methods ---

    private void validateBookingTimes(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalStateException("End time must be after start time");
        }
    }

    private void checkConflicts(Long resourceId, java.time.LocalDateTime start, java.time.LocalDateTime end, Long currentBookingId) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(resourceId, start, end);
        
        // If updating, ignore the conflict with itself
        boolean hasRealConflict = conflicts.stream()
            .anyMatch(b -> !b.getId().equals(currentBookingId));

        if (hasRealConflict) {
            throw new BookingConflictException("Resource already booked for the selected time slot.");
        }
    }

    private Booking.ResponseDTO toDTO(Booking b) {
        return Booking.ResponseDTO.builder()
            .id(b.getId()).userId(b.getUserId()).resourceId(b.getResourceId())
            .startTime(b.getStartTime()).endTime(b.getEndTime())
            .purpose(b.getPurpose()).attendeesCount(b.getAttendeesCount())
            .status(b.getStatus()).rejectionReason(b.getRejectionReason())
            .createdAt(b.getCreatedAt()).updatedAt(b.getUpdatedAt())
            .build();
    }
}