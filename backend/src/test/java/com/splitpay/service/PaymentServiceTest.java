package com.splitpay.service;

import com.splitpay.document.Payment;
import com.splitpay.document.PaymentStatus;
import com.splitpay.document.Settlement;
import com.splitpay.document.SettlementStatus;
import com.splitpay.dto.request.PaymentVerifyRequest;
import com.splitpay.dto.response.PaymentVerifyResponse;
import com.splitpay.exception.ForbiddenException;
import com.splitpay.payment.RazorpayGateway;
import com.splitpay.repository.PaymentRepository;
import com.splitpay.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private SettlementRepository settlementRepository;
    @Mock private RazorpayGateway razorpayGateway;

    private PaymentService paymentService;

    private static final String USER_A = "user-a"; // debtor, expected to pay
    private static final String USER_B = "user-b"; // creditor

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, settlementRepository, razorpayGateway);
    }

    private Payment createdPayment() {
        return Payment.builder().id("pay-1").settlementId("settle-1")
                .razorpayOrderId("order_test123").amount(new BigDecimal("500"))
                .status(PaymentStatus.CREATED).build();
    }

    private Settlement pendingSettlement() {
        return Settlement.builder().id("settle-1").groupId("group-1")
                .fromUserId(USER_A).toUserId(USER_B).amount(new BigDecimal("500"))
                .status(SettlementStatus.PENDING).build();
    }

    @Test
    void verifyMarksSettlementPaidWhenSignatureValid() {
        PaymentVerifyRequest req = new PaymentVerifyRequest();
        req.setRazorpayOrderId("order_test123");
        req.setRazorpayPaymentId("pay_test456");
        req.setRazorpaySignature("valid-signature");

        when(paymentRepository.findByRazorpayOrderId("order_test123")).thenReturn(Optional.of(createdPayment()));
        when(settlementRepository.findById("settle-1")).thenReturn(Optional.of(pendingSettlement()));
        when(razorpayGateway.verifySignature("order_test123", "pay_test456", "valid-signature")).thenReturn(true);
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(settlementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentVerifyResponse response = paymentService.verify(USER_A, req);

        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(settlementRepository).save(argThat(s -> s.getStatus() == SettlementStatus.PAID));
    }

    @Test
    void verifyMarksFailedWhenSignatureInvalid() {
        PaymentVerifyRequest req = new PaymentVerifyRequest();
        req.setRazorpayOrderId("order_test123");
        req.setRazorpayPaymentId("pay_test456");
        req.setRazorpaySignature("forged-signature");

        when(paymentRepository.findByRazorpayOrderId("order_test123")).thenReturn(Optional.of(createdPayment()));
        when(settlementRepository.findById("settle-1")).thenReturn(Optional.of(pendingSettlement()));
        when(razorpayGateway.verifySignature("order_test123", "pay_test456", "forged-signature")).thenReturn(false);
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(settlementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentVerifyResponse response = paymentService.verify(USER_A, req);

        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(settlementRepository).save(argThat(s -> s.getStatus() == SettlementStatus.FAILED));
    }

    @Test
    void duplicateVerificationOfAlreadySuccessfulPaymentIsIdempotent() {
        Payment alreadyVerified = createdPayment();
        alreadyVerified.setStatus(PaymentStatus.SUCCESS);

        PaymentVerifyRequest req = new PaymentVerifyRequest();
        req.setRazorpayOrderId("order_test123");
        req.setRazorpayPaymentId("pay_test456");
        req.setRazorpaySignature("valid-signature");

        when(paymentRepository.findByRazorpayOrderId("order_test123")).thenReturn(Optional.of(alreadyVerified));

        PaymentVerifyResponse response = paymentService.verify(USER_A, req);

        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(response.getMessage()).contains("already verified");
        // Signature is never re-checked and settlement is never re-saved on the idempotent path
        verifyNoInteractions(razorpayGateway);
        verify(settlementRepository, never()).save(any());
    }

    @Test
    void onlyDebtorCanVerifyTheirOwnPayment() {
        PaymentVerifyRequest req = new PaymentVerifyRequest();
        req.setRazorpayOrderId("order_test123");
        req.setRazorpayPaymentId("pay_test456");
        req.setRazorpaySignature("valid-signature");

        when(paymentRepository.findByRazorpayOrderId("order_test123")).thenReturn(Optional.of(createdPayment()));
        when(settlementRepository.findById("settle-1")).thenReturn(Optional.of(pendingSettlement()));

        // USER_B is the creditor, not the one who owes -> should not be able to verify
        assertThatThrownBy(() -> paymentService.verify(USER_B, req))
                .isInstanceOf(ForbiddenException.class);
    }
}
