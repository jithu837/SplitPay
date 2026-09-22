package com.splitpay.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Embedded sub-document: how much a single member owes for one expense.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseParticipant {
    private String userId;
    private BigDecimal amount;
    /** Only populated/relevant when the parent expense's splitType is PERCENTAGE. */
    private BigDecimal percentage;
}
