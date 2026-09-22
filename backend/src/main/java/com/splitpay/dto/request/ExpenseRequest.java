package com.splitpay.dto.request;

import com.splitpay.document.ExpenseCategory;
import com.splitpay.document.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ExpenseRequest {

    @NotBlank
    private String description;

    @NotNull
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull
    private ExpenseCategory category;

    @NotBlank
    private String paidBy;

    @NotNull
    private SplitType splitType;

    @NotEmpty(message = "At least one participant is required")
    @Valid
    private List<ExpenseParticipantRequest> participants;
}
