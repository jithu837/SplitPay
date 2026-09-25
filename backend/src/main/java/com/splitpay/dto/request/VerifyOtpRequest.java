package com.splitpay.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "Email or Mobile number is required")
    private String email;

    private String phone;

    private String emailOrPhone;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "\\d{4}", message = "OTP must be exactly 4 digits")
    private String otp;

    public String getIdentifier() {
        if (emailOrPhone != null && !emailOrPhone.trim().isEmpty()) {
            return emailOrPhone.trim();
        }
        if (phone != null && !phone.trim().isEmpty()) {
            return phone.trim();
        }
        return email != null ? email.trim() : "";
    }
}
