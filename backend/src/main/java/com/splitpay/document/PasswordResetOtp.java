package com.splitpay.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "password_reset_otps")
public class PasswordResetOtp {

    @Id
    private String id;

    @Indexed
    private String email;

    /** 6-digit OTP code */
    private String otp;

    /** Absolute expiry timestamp (10 minutes from creation) */
    private Instant expiresAt;

    /** Marks OTP as consumed so it cannot be reused */
    @Builder.Default
    private boolean used = false;
}
