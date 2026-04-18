package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.*;
import com.smartcampus.booking.exception.*;
import com.smartcampus.booking.model.*;
import com.smartcampus.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO dto) {
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalStateException("End time must be after start time");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            dto.getResourceId(), dto.getStartTime(), dto.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                "Resource is already booked during this time. Conflicting booking ID: "
                + conflicts.get(0).getId()
            );
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
    public BookingResponseDTO getBookingById(Long id) {
        return toDTO(bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id)));
    }

    @Override
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    public List<BookingResponseDTO> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUserId(userId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<BookingResponseDTO> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status).stream().map(this::toDTO).toList();
    }

    @Override
    public List<BookingResponseDTO> getBookingsByResource(Integer resourceId) {
        return bookingRepository.findByResourceId(resourceId).stream().map(this::toDTO).toList();
    }

    @Override
    public BookingResponseDTO approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException(
                "Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }
        booking.setStatus(BookingStatus.APPROVED);
        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException(
                "Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        return toDTO(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException(id));
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException(
                "Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus());
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

    private BookingResponseDTO toDTO(Booking b) {
        return BookingResponseDTO.builder()
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
