package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Booking.ResponseDTO> createBooking(
            @Valid @RequestBody Booking.RequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(bookingService.createBooking(dto));
    }

    // Added: PUT mapping for updating existing PENDING bookings
    @PutMapping("/{id}") // <--- Must have the {id} here
    public ResponseEntity<Booking.ResponseDTO> updateBooking(
        @PathVariable Long id, // <--- Name must match the one above
        @Valid @RequestBody Booking.RequestDTO dto) {
    return ResponseEntity.ok(bookingService.updateBooking(id, dto));
    }
    @GetMapping
    public ResponseEntity<List<Booking.ResponseDTO>> getAllBookings(
            @RequestParam(required = false) BookingStatus status) {
        if (status != null) {
            return ResponseEntity.ok(bookingService.getBookingsByStatus(status));
        }
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking.ResponseDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking.ResponseDTO>> getBookingsByUser(@PathVariable Long userId) { 
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<Booking.ResponseDTO>> getBookingsByResource(@PathVariable Long resourceId) {
        return ResponseEntity.ok(bookingService.getBookingsByResource(resourceId));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<Booking.ResponseDTO> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Booking.ResponseDTO> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody Booking.RejectDTO dto) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, dto.getReason()));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking.ResponseDTO> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}