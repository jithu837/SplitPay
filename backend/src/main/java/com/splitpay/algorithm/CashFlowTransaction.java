package com.splitpay.algorithm;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CashFlowTransaction {
    private String fromUserId;
    private String toUserId;
    private BigDecimal amount;
}
