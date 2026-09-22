package com.splitpay.algorithm;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

/** Mutable working balance for one user, used only inside the cash-flow algorithm. */
@Data
@AllArgsConstructor
public class UserBalance {
    private final String userId;
    private BigDecimal amount; // positive = should receive, negative = owes

    public void add(BigDecimal delta) {
        this.amount = this.amount.add(delta);
    }
}
