package com.splitpay.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank
    @Size(min = 2, max = 80)
    private String name;

    /**
     * Optional — 10-digit Indian mobile number.
     * Null or blank means "leave phone unchanged".
     * Exactly 10 digits means "update to this number".
     */
    @Pattern(regexp = "^[0-9]{10}$|^$", message = "Mobile number must be a valid 10-digit number or left blank")
    private String phone;
}
