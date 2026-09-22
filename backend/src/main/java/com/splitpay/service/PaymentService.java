package com.splitpay.service;

import com.razorpay.RazorpayException;
import com.splitpay.document.Payment;
import com.splitpay.document.PaymentStatus;
import com.splitpay.document.Settlement;
import com.splitpay.document.SettlementStatus;
import com.splitpay.dto.request.PaymentOrderRequest;
import com.splitpay.dto.request.PaymentVerifyRequest;
import com.splitpay.dto.response.PaymentOrderResponse;
import com.splitpay.dto.response.PaymentVerifyResponse;
import com.splitpay.exception.BadRequestException;
import com.splitpay.exception.ForbiddenException;
import com.splitpay.payment.RazorpayGateway;
import com.splitpay.repository.PaymentRepository;
import com.splitpay.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Handles Razorpay order creation and server-side payment verification.
 *
 * SECURITY NOTES:
 *  - The Razorpay key SECRET never leaves this class; only the public key id
 *    and order id are returned to the frontend (see PaymentOrderResponse).
 *  - Frontend "payment success" callbacks are never trusted on their own —
 *    verifySignature() re-derives the HMAC server-side before anything is
 *    marked PAID.
 *  - verify() is idempotent: re-submitting the same razorpayOrderId after it
 *    has already been marked SUCCESS is a no-op that returns the existing
 *    result rather than double-processing the settlement.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SettlementRepository settlementRepository;
    private final RazorpayGateway razorpayGateway;

    public PaymentOrderResponse createOrder(String requesterId, PaymentOrderRequest request) {
        Settlement settlement = settlementRepository.findById(request.getSettlementId())
                .orElseThrow(() -> new BadRequestException("Settlement not found: " + request.getSettlementId()));

        if (!settlement.getFromUserId().equals(requesterId)) {
            throw new ForbiddenException("Only the person who owes this settlement can pay it");
        }
        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new BadRequestException("This settlement has already been paid");
        }
        if (settlement.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid settlement amount");
        }

        try {
            JSONObject order = razorpayGateway.createOrder(settlement.getAmount(), settlement.getId());
            String orderId = order.getString("id");

            Payment payment = Payment.builder()
                    .settlementId(settlement.getId())
                    .razorpayOrderId(orderId)
                    .amount(settlement.getAmount())
                    .status(PaymentStatus.CREATED)
                    .build();
            paymentRepository.save(payment);

            return PaymentOrderResponse.builder()
                    .razorpayOrderId(orderId)
                    .razorpayKeyId(razorpayGateway.getKeyId())
                    .amount(settlement.getAmount())
                    .currency("INR")
                    .settlementId(settlement.getId())
                    .build();
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed for settlement {}: {}", settlement.getId(), e.getMessage());
            throw new BadRequestException("Could not create payment order. Please try again.");
        }
    }

    @Transactional
    public PaymentVerifyResponse verify(String requesterId, PaymentVerifyRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new BadRequestException("No payment order found for this order id"));

        // Idempotency: if this order was already verified successfully, don't reprocess.
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return PaymentVerifyResponse.builder()
                    .settlementId(payment.getSettlementId())
                    .paymentStatus(PaymentStatus.SUCCESS)
                    .message("Payment was already verified previously")
                    .build();
        }

        Settlement settlement = settlementRepository.findById(payment.getSettlementId())
                .orElseThrow(() -> new BadRequestException("Settlement for this payment no longer exists"));

        if (!settlement.getFromUserId().equals(requesterId)) {
            throw new ForbiddenException("You are not authorized to verify this payment");
        }

        boolean validSignature = razorpayGateway.verifySignature(
                request.getRazorpayOrderId(), request.getRazorpayPaymentId(), request.getRazorpaySignature());

        if (!validSignature) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            paymentRepository.save(payment);

            settlement.setStatus(SettlementStatus.FAILED);
            settlementRepository.save(settlement);

            log.warn("Razorpay signature verification FAILED for order {}", request.getRazorpayOrderId());
            return PaymentVerifyResponse.builder()
                    .settlementId(settlement.getId())
                    .paymentStatus(PaymentStatus.FAILED)
                    .message("Payment signature verification failed")
                    .build();
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        paymentRepository.save(payment);

        settlement.setStatus(SettlementStatus.PAID);
        settlement.setPaidAt(Instant.now());
        settlementRepository.save(settlement);

        return PaymentVerifyResponse.builder()
                .settlementId(settlement.getId())
                .paymentStatus(PaymentStatus.SUCCESS)
                .message("Payment verified and settlement marked as PAID")
                .build();
    }
}
