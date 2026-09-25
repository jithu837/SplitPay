package com.splitpay.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Email or Mobile number is required")
    private String email;

    private String phone;

    private String emailOrPhone;

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
