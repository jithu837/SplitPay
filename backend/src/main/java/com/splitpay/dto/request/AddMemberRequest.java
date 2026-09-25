package com.splitpay.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddMemberRequest {

    @NotBlank(message = "Email or Mobile number is required")
    private String email;

    private String emailOrPhone;

    public String getIdentifier() {
        if (emailOrPhone != null && !emailOrPhone.trim().isEmpty()) {
            return emailOrPhone.trim();
        }
        return email != null ? email.trim() : "";
    }
}
