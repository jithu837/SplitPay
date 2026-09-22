package com.splitpay.dto.response;

import com.splitpay.document.SettlementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementDto {
    private String id;
    private String groupId;
    private String fromUserId;
    private String fromUserName;
    private String toUserId;
    private String toUserName;
    private BigDecimal amount;
    private SettlementStatus status;
    private Instant createdAt;
    private Instant paidAt;
}
