package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectBookingDTO {

    @NotBlank(message = "Rejection reason is required")
    private String reason;
}