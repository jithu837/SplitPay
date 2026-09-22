package com.splitpay.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentOrderRequest {

    @NotBlank
    private String settlementId;
}
