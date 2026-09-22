package com.splitpay.controller;

import com.splitpay.dto.request.PaymentOrderRequest;
import com.splitpay.dto.request.PaymentVerifyRequest;
import com.splitpay.dto.response.PaymentOrderResponse;
import com.splitpay.dto.response.PaymentVerifyResponse;
import com.splitpay.security.CurrentUser;
import com.splitpay.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponse> createOrder(@Valid @RequestBody PaymentOrderRequest request) {
        return ResponseEntity.ok(paymentService.createOrder(CurrentUser.id(), request));
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentVerifyResponse> verify(@Valid @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(paymentService.verify(CurrentUser.id(), request));
    }
}
