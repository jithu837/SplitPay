package com.splitpay.controller;

import com.splitpay.dto.request.ForgotPasswordRequest;
import com.splitpay.dto.request.LoginRequest;
import com.splitpay.dto.request.RegisterRequest;
import com.splitpay.dto.request.ResetPasswordRequest;
import com.splitpay.dto.request.VerifyOtpRequest;
import com.splitpay.dto.response.AuthResponse;
import com.splitpay.dto.response.MessageResponse;
import com.splitpay.dto.response.VerifyOtpResponse;
import com.splitpay.service.AuthService;
import com.splitpay.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    // ── Existing endpoints ──────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ── Forgot Password / OTP flow (no auth required) ──────────────────────

    /** Step 1 — Send 6-digit OTP to the registered email */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.sendOtp(request));
    }

    /** Step 2 — Verify OTP; returns a short-lived reset token on success */
    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(passwordResetService.verifyOtp(request));
    }

    /** Step 3 — Reset the password using the reset token from step 2 */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.resetPassword(request));
    }
}
