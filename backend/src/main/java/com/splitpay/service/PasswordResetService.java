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

    @Value("${app.mail.brevo-api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @Value("${app.mail.resend-api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${app.mail.from-name:SplitPay}")
    private String fromName;

    @Value("${app.sms.fast2sms-api-key:${FAST2SMS_API_KEY:}}")
    private String fast2smsApiKey;

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1 — Send OTP
    // ─────────────────────────────────────────────────────────────────────────

    public MessageResponse sendOtp(ForgotPasswordRequest request) {
        String input = request.getIdentifier().trim();
        String cleanPhone = input.replaceAll("[^0-9]", "");

        User user = null;
        if (input.contains("@")) {
            user = userRepository.findByEmail(input.toLowerCase()).orElse(null);
        } else if (cleanPhone.length() == 10) {
            user = userRepository.findByPhone(cleanPhone).orElse(null);
        } else {
            user = userRepository.findByEmail(input.toLowerCase())
                    .or(() -> userRepository.findByPhone(cleanPhone))
                    .orElse(null);
        }

        // Always respond with success message to avoid user enumeration
        if (user == null) {
            log.info("Forgot-password requested for unknown identifier (silently ignored): {}", input);
            return MessageResponse.builder()
                    .message("If this email or mobile number is registered, a verification code has been sent.")
                    .build();
        }

        String userEmail = user.getEmail();
        String userPhone = user.getPhone();

        // Invalidate previous OTPs for both email and phone
        otpRepository.deleteByEmail(userEmail);
        otpRepository.deleteByIdentifier(userEmail);
        if (userPhone != null) {
            otpRepository.deleteByIdentifier(userPhone);
        }

        // Generate 4-digit OTP
        String otp = String.format("%04d", new SecureRandom().nextInt(10_000));

        PasswordResetOtp otpRecord = PasswordResetOtp.builder()
                .email(userEmail)
                .identifier(input)
                .otp(otp)
                .expiresAt(Instant.now().plusSeconds((long) otpExpiryMinutes * 60))
                .used(false)
                .build();

        otpRepository.save(otpRecord);

        // Dispatch OTP via SMS if input is phone or user has phone
        boolean smsSent = false;
        if (userPhone != null && !userPhone.isEmpty()) {
            smsSent = sendOtpSms(userPhone, otp);
        }

        // Dispatch OTP via Email if input is email or user has email
        boolean emailSent = false;
        if (userEmail != null && !userEmail.isEmpty()) {
            try {
                sendOtpEmail(userEmail, otp);
                emailSent = true;
            } catch (Exception ex) {
                log.warn("Email dispatch failed: {}", ex.getMessage());
            }
        }

        if (!smsSent && !emailSent) {
            log.error("Could not send OTP via SMS or Email for {}", input);
            throw new BadRequestException("Failed to deliver OTP. Please check your credentials or try again later.");
        }

        log.info("OTP successfully dispatched for user: email={}, phone={}", userEmail, userPhone);
        return MessageResponse.builder()
                .message("If this email or mobile number is registered, a verification code has been sent.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 — Verify OTP → return reset token
    // ─────────────────────────────────────────────────────────────────────────

    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String input = request.getIdentifier().trim();
        String cleanPhone = input.replaceAll("[^0-9]", "");

        PasswordResetOtp otpRecord = otpRepository
                .findTopByIdentifierAndUsedFalseOrderByExpiresAtDesc(input)
                .or(() -> otpRepository.findTopByEmailAndUsedFalseOrderByExpiresAtDesc(input.toLowerCase()))
                .or(() -> cleanPhone.length() == 10 ? otpRepository.findTopByIdentifierAndUsedFalseOrderByExpiresAtDesc(cleanPhone) : java.util.Optional.empty())
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP. Please request a new one."));

        if (otpRecord.isUsed()) {
            throw new BadRequestException("OTP has already been used. Please request a new one.");
        }

        if (Instant.now().isAfter(otpRecord.getExpiresAt())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (!otpRecord.getOtp().equals(request.getOtp().trim())) {
            throw new BadRequestException("Incorrect OTP. Please try again.");
        }

        // Mark OTP as used
        otpRecord.setUsed(true);
        otpRepository.save(otpRecord);

        // Issue a short-lived (5 min) reset-only JWT with user's email
        String resetToken = buildResetToken(otpRecord.getEmail());

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
        otpRepository.deleteByIdentifier(email);
        if (user.getPhone() != null) {
            otpRepository.deleteByIdentifier(user.getPhone());
        }

        log.info("Password reset successfully for {}", email);
        return MessageResponse.builder()
                .message("Password reset successfully. You can now log in with your new password.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers — SMS & Email Dispatch
    // ─────────────────────────────────────────────────────────────────────────

    private boolean sendOtpSms(String phone, String otp) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (cleanPhone.length() == 10) {
            cleanPhone = "91" + cleanPhone; // India country code
        }

        // 1. Try Brevo Transactional SMS if API key present
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            try {
                String payload = String.format(
                    "{\"sender\":\"SplitPay\",\"recipient\":\"+%s\",\"content\":\"Your SplitPay verification code is %s. Valid for %d minutes.\"}",
                    cleanPhone, otp, otpExpiryMinutes
                );
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("https://api.brevo.com/v3/transactionalSMS/sms"))
                        .header("api-key", brevoApiKey.trim())
                        .header("Content-Type", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                        .timeout(java.time.Duration.ofSeconds(10))
                        .build();
                java.net.http.HttpResponse<String> res = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() < 400) {
                    log.info("SMS delivered to {} via Brevo SMS", phone);
                    return true;
                }
            } catch (Exception ex) {
                log.warn("Brevo SMS failed for {}: {}", phone, ex.getMessage());
            }
        }

        // 2. Try Fast2SMS API if present
        if (fast2smsApiKey != null && !fast2smsApiKey.trim().isEmpty()) {
            try {
                String mobile = phone.replaceAll("[^0-9]", "");
                if (mobile.length() > 10) mobile = mobile.substring(mobile.length() - 10);
                String payload = String.format(
                    "{\"route\":\"otp\",\"variables_values\":\"%s\",\"numbers\":\"%s\"}",
                    otp, mobile
                );
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("https://www.fast2sms.com/dev/bulkV2"))
                        .header("authorization", fast2smsApiKey.trim())
                        .header("Content-Type", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
                        .timeout(java.time.Duration.ofSeconds(10))
                        .build();
                java.net.http.HttpResponse<String> res = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() < 400) {
                    log.info("SMS delivered to {} via Fast2SMS", phone);
                    return true;
                }
            } catch (Exception ex) {
                log.warn("Fast2SMS failed for {}: {}", phone, ex.getMessage());
            }
        }

        return false;
    }

    private void sendOtpEmail(String toEmail, String otp) {
        boolean sent = false;

        // 1. Try sending via Brevo HTTPS REST API (Port 443 — works seamlessly on Render)
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            try {
                sendViaBrevoHttp(toEmail, otp);
                log.info("OTP email sent successfully to {} via Brevo HTTP API", toEmail);
                sent = true;
            } catch (Exception ex) {
                log.error("Brevo API delivery failed for {}: {}", toEmail, ex.getMessage());
            }
        }

        // 2. Try sending via Resend HTTPS REST API (Port 443)
        if (!sent && resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            try {
                sendViaResendHttp(toEmail, otp);
                log.info("OTP email sent successfully to {} via Resend HTTP API", toEmail);
                sent = true;
            } catch (Exception ex) {
                log.error("Resend API delivery failed for {}: {}", toEmail, ex.getMessage());
            }
        }

        // 3. Try sending via Spring JavaMailSender (SMTP)
        if (!sent) {
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
                log.info("OTP email sent successfully to {} via SMTP", toEmail);
                sent = true;
            } catch (Exception ex) {
                log.error("SMTP delivery failed for {}: {}", toEmail, ex.getMessage());
            }
        }

        if (!sent) {
            throw new BadRequestException(
                "Failed to send OTP email to " + toEmail + ". Cloud hosting blocks direct SMTP (port 587). Please configure BREVO_API_KEY or RESEND_API_KEY in Render Environment."
            );
        }
    }

    private void sendViaBrevoHttp(String toEmail, String otp) throws Exception {
        String senderEmail = (fromEmail != null && fromEmail.contains("@")) ? fromEmail.trim() : "splitpayonline7@gmail.com";
        String htmlBody = String.format(
            "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'><div style='max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'><h2 style='color: #2563eb;'>SplitPay</h2><p>Hello,</p><p>You requested a password reset for your SplitPay account.</p><p>Your OTP (One-Time Password) is:</p><div style='background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; text-align: center; margin: 20px 0;'><span style='font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #166534;'>%s</span></div><p>This code will expire in <strong>%d minutes</strong>.</p><p style='color: #777; font-size: 13px;'>If you did not request this, please ignore this email.</p></div></body></html>",
            otp, otpExpiryMinutes
        );

        String jsonPayload = String.format(
            "{\"sender\":{\"name\":\"%s\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"SplitPay — Your Password Reset OTP\",\"htmlContent\":\"%s\"}",
            fromName, senderEmail, toEmail, htmlBody.replace("\"", "\\\"")
        );

        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(java.time.Duration.ofSeconds(10))
                .build();

        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Brevo HTTP error " + response.statusCode() + ": " + response.body());
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
