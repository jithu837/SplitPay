package com.splitpay.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExpenseParticipantRequest {

    @NotBlank
    private String userId;

    /** Required for EXACT split. Ignored (recomputed) for EQUAL. */
    private BigDecimal amount;

    /** Required for PERCENTAGE split. */
    private BigDecimal percentage;
}
