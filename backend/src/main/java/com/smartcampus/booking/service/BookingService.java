package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.*;
import com.smartcampus.booking.model.BookingStatus;

import java.util.List;
import java.util.UUID;

public interface BookingService {
    BookingResponseDTO createBooking(BookingRequestDTO dto);
    BookingResponseDTO getBookingById(Long id);
    List<BookingResponseDTO> getAllBookings();
    List<BookingResponseDTO> getBookingsByUser(UUID userId);
    List<BookingResponseDTO> getBookingsByStatus(BookingStatus status);
    List<BookingResponseDTO> getBookingsByResource(Integer resourceId);
    BookingResponseDTO approveBooking(Long id);
    BookingResponseDTO rejectBooking(Long id, String reason);
    BookingResponseDTO cancelBooking(Long id);
    void deleteBooking(Long id);
}