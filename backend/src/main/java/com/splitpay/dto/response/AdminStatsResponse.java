package com.splitpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalGroups;
    private long totalExpenses;
    private long totalSettlements;
    private BigDecimal totalExpenseAmount;
    private Map<String, Long> paymentStatusSummary;
}
