package com.splitpay.dto.response;

import com.splitpay.document.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerifyResponse {
    private String settlementId;
    private PaymentStatus paymentStatus;
    private String message;
}
