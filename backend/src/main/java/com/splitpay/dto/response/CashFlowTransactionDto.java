package com.splitpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashFlowTransactionDto {
    private String fromUserId;
    private String fromUserName;
    private String toUserId;
    private String toUserName;
    private BigDecimal amount;
}
