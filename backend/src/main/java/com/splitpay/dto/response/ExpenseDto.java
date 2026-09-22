package com.splitpay.dto.response;

import com.splitpay.document.ExpenseCategory;
import com.splitpay.document.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDto {
    private String id;
    private String groupId;
    private String description;
    private BigDecimal amount;
    private ExpenseCategory category;
    private String paidBy;
    private String paidByName;
    private SplitType splitType;
    private List<ExpenseParticipantDto> participants;
    private Instant createdAt;
}
