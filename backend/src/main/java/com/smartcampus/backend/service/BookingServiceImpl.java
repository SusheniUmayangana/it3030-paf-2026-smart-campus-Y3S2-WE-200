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
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalStateException("End time must be after start time");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            dto.getResourceId(), dto.getStartTime(), dto.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException("Resource already booked.");
        }

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
    public Booking.ResponseDTO getBookingById(Long id) {
        return toDTO(bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id)));
    }

    @Override
    public List<Booking.ResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    public List<Booking.ResponseDTO> getBookingsByUser(Long userId) { // Change UUID to Long
        return bookingRepository.findByUserId(userId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<Booking.ResponseDTO> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status).stream().map(this::toDTO).toList();
    }

    @Override
    public List<Booking.ResponseDTO> getBookingsByResource(Long resourceId) { // Change Integer to Long
        return bookingRepository.findByResourceId(resourceId).stream().map(this::toDTO).toList();
    }

    @Override
    public Booking.ResponseDTO approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));
            
        // Guard: Only allow approval if it's currently PENDING
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.APPROVED);
        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public Booking.ResponseDTO rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));

        // Guard: Only allow rejection if it's currently PENDING
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public Booking.ResponseDTO cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));

        // Guard: Only allow cancellation if it's currently APPROVED
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public void deleteBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            throw new BookingNotFoundException(id);
        }
        bookingRepository.deleteById(id);
    }

    

    private Booking.ResponseDTO toDTO(Booking b) {
        return Booking.ResponseDTO.builder()
            .id(b.getId())
            .userId(b.getUserId())
            .resourceId(b.getResourceId())
            .startTime(b.getStartTime())
            .endTime(b.getEndTime())
            .purpose(b.getPurpose())
            .attendeesCount(b.getAttendeesCount())
            .status(b.getStatus())
            .rejectionReason(b.getRejectionReason())
            .createdAt(b.getCreatedAt())
            .updatedAt(b.getUpdatedAt())
            .build();
    }
}