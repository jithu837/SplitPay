package com.splitpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpResponse {
    /** Short-lived JWT used exclusively for the reset-password step */
    private String resetToken;
    private String message;
}
