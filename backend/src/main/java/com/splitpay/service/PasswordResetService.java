package com.splitpay.service;

import com.splitpay.document.PasswordResetOtp;
import com.splitpay.document.User;
import com.splitpay.dto.request.ForgotPasswordRequest;
import com.splitpay.dto.request.ResetPasswordRequest;
import com.splitpay.dto.request.VerifyOtpRequest;
import com.splitpay.dto.response.MessageResponse;
import com.splitpay.dto.response.VerifyOtpResponse;
import com.splitpay.exception.BadRequestException;
import com.splitpay.exception.ResourceNotFoundException;
import com.splitpay.repository.PasswordResetOtpRepository;
import com.splitpay.repository.UserRepository;
import com.splitpay.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;

/**
 * Handles the 3-step forgot-password / OTP flow:
 *   1. sendOtp()       — generate 6-digit OTP, store in DB, email it to user
 *   2. verifyOtp()     — check OTP + expiry, mark used, return a short-lived reset JWT
 *   3. resetPassword() — validate reset JWT, BCrypt-hash the new password, save
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.reset-password.otp-expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1 — Send OTP
    // ─────────────────────────────────────────────────────────────────────────

    public MessageResponse sendOtp(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Always respond with the same message to avoid email enumeration attacks.
        // Internally skip if user doesn't exist.
        if (!userRepository.existsByEmail(email)) {
            log.info("Forgot-password requested for unknown email (silently ignored): {}", email);
            return MessageResponse.builder()
                    .message("If this email is registered, an OTP has been sent to it.")
                    .build();
        }

        // Invalidate any previous unused OTPs for this email
        otpRepository.deleteByEmail(email);

        // Generate cryptographically random 4-digit OTP
        String otp = String.format("%04d", new SecureRandom().nextInt(10_000));

        PasswordResetOtp otpRecord = PasswordResetOtp.builder()
                .email(email)
                .otp(otp)
                .expiresAt(Instant.now().plusSeconds((long) otpExpiryMinutes * 60))
                .used(false)
                .build();

        otpRepository.save(otpRecord);

        sendOtpEmail(email, otp);

        log.info("OTP sent to {}", email);
        return MessageResponse.builder()
                .message("If this email is registered, an OTP has been sent to it.")
                .otp(otp)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 — Verify OTP → return reset token
    // ─────────────────────────────────────────────────────────────────────────

    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        PasswordResetOtp otpRecord = otpRepository
                .findTopByEmailAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP. Please request a new one."));

        if (otpRecord.isUsed()) {
            throw new BadRequestException("OTP has already been used. Please request a new one.");
        }

        if (Instant.now().isAfter(otpRecord.getExpiresAt())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (!otpRecord.getOtp().equals(request.getOtp())) {
            throw new BadRequestException("Incorrect OTP. Please try again.");
        }

        // Mark OTP as used
        otpRecord.setUsed(true);
        otpRepository.save(otpRecord);

        // Issue a short-lived (5 min) reset-only JWT
        String resetToken = buildResetToken(email);

        return VerifyOtpResponse.builder()
                .resetToken(resetToken)
                .message("OTP verified successfully. You may now reset your password.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3 — Reset Password using reset token
    // ─────────────────────────────────────────────────────────────────────────

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String email = extractEmailFromResetToken(request.getResetToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Clean up any remaining OTP records for this user
        otpRepository.deleteByEmail(email);

        log.info("Password reset successfully for {}", email);
        return MessageResponse.builder()
                .message("Password reset successfully. You can now log in with your new password.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from-name:SplitPay}")
    private String fromName;

    private void sendOtpEmail(String toEmail, String otp) {
        // Always log OTP to server logs for debugging and fallback
        log.info("==================================================");
        log.info("🔐 [SPLITPAY OTP] Generated OTP for {}: {}", toEmail, otp);
        log.info("==================================================");

        // 1. Try sending via Resend HTTPS REST API if API key is present (Port 443, never blocked by Render)
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            try {
                sendViaResendHttp(toEmail, otp);
                log.info("OTP sent successfully to {} via Resend HTTP API", toEmail);
                return;
            } catch (Exception ex) {
                log.warn("Resend API delivery failed for {}: {}. Trying SMTP...", toEmail, ex.getMessage());
            }
        }

        // 2. Try sending via Spring JavaMailSender (SMTP)
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("SplitPay — Your Password Reset OTP");
            message.setText(
                    "Hello,\n\n" +
                    "You requested a password reset for your SplitPay account.\n\n" +
                    "Your OTP (One-Time Password) is:\n\n" +
                    "    " + otp + "\n\n" +
                    "This OTP is valid for " + otpExpiryMinutes + " minutes.\n" +
                    "Do NOT share it with anyone.\n\n" +
                    "If you did not request this, please ignore this email — your account is safe.\n\n" +
                    "— SplitPay Team"
            );
            mailSender.send(message);
            log.info("OTP sent successfully to {} via SMTP", toEmail);
        } catch (Exception ex) {
            // Render Free Tier blocks outbound SMTP ports (25, 465, 587)
            log.warn("⚠️ SMTP delivery failed (Render Free Tier blocks outbound SMTP). Falling back - OTP logged above in server logs. Error: {}", ex.getMessage());
        }
    }

    private void sendViaResendHttp(String toEmail, String otp) throws Exception {
        String jsonPayload = String.format(
            "{\"from\":\"%s <onboarding@resend.dev>\",\"to\":[\"%s\"],\"subject\":\"SplitPay — Your Password Reset OTP\",\"text\":\"Hello,\\n\\nYour OTP is: %s\\n\\nValid for %d minutes.\\n\\n— SplitPay Team\"}",
            fromName, toEmail, otp, otpExpiryMinutes
        );

        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(java.time.Duration.ofSeconds(10))
                .build();

        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Resend API error " + response.statusCode() + ": " + response.body());
        }
    }

    /** Builds a short-lived JWT (5 minutes) that carries only the email claim for the reset step. */
    private String buildResetToken(String email) {
        SecretKey key = buildKey();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 5 * 60 * 1000L); // 5 minutes
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "password-reset")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /** Extracts and validates email from a reset token; throws BadRequestException on failure. */
    private String extractEmailFromResetToken(String resetToken) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(buildKey())
                    .build()
                    .parseSignedClaims(resetToken)
                    .getPayload();

            if (!"password-reset".equals(claims.get("purpose", String.class))) {
                throw new BadRequestException("Invalid reset token.");
            }
            if (claims.getExpiration().before(new Date())) {
                throw new BadRequestException("Reset token has expired. Please start over.");
            }
            return claims.getSubject();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Invalid or expired reset token. Please start over.");
        }
    }

    private SecretKey buildKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        byte[] paddedKey = keyBytes.length >= 32 ? keyBytes : padTo32(keyBytes);
        return Keys.hmacShaKeyFor(paddedKey);
    }

    private byte[] padTo32(byte[] input) {
        byte[] padded = new byte[32];
        System.arraycopy(input, 0, padded, 0, Math.min(input.length, 32));
        return padded;
    }
}
