package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.BookingNotFoundException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;

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

        return toDTO(bookingRepository.save(booking));
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
        return toDTO(bookingRepository.save(booking));
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
        return toDTO(bookingRepository.save(booking));
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