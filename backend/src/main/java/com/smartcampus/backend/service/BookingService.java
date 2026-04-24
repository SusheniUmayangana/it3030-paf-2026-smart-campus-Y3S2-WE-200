package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import java.util.List;

public interface BookingService {
    Booking.ResponseDTO createBooking(Booking.RequestDTO dto);
    
    // Added for Frontend Update functionality
    Booking.ResponseDTO updateBooking(Long id, Booking.RequestDTO dto); 
    
    Booking.ResponseDTO getBookingById(Long id);
    List<Booking.ResponseDTO> getAllBookings();
    List<Booking.ResponseDTO> getBookingsByUser(Long userId);
    List<Booking.ResponseDTO> getBookingsByStatus(BookingStatus status);
    List<Booking.ResponseDTO> getBookingsByResource(Long resourceId);
    Booking.ResponseDTO approveBooking(Long id);
    Booking.ResponseDTO rejectBooking(Long id, String reason);
    Booking.ResponseDTO cancelBooking(Long id);
    void deleteBooking(Long id);
}