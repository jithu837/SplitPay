package com.splitpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MinimumCashFlowResponse {
    private List<CashFlowTransactionDto> originalObligations;
    private List<CashFlowTransactionDto> optimizedSettlements;
    private int originalTransactionCount;
    private int optimizedTransactionCount;
    private BigDecimal totalSettlementAmount;
}
