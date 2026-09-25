package com.splitpay.repository;

import com.splitpay.document.PasswordResetOtp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PasswordResetOtpRepository extends MongoRepository<PasswordResetOtp, String> {

    /** Find the latest unused OTP record for a given email or identifier */
    Optional<PasswordResetOtp> findTopByEmailAndUsedFalseOrderByExpiresAtDesc(String email);
    Optional<PasswordResetOtp> findTopByIdentifierAndUsedFalseOrderByExpiresAtDesc(String identifier);

    /** Clean up all OTP records for an email or identifier (after successful reset) */
    void deleteByEmail(String email);
    void deleteByIdentifier(String identifier);
}
