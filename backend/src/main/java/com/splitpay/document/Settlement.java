package com.splitpay.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "settlements")
public class Settlement {

    @Id
    private String id;

    @Indexed
    private String groupId;

    @Indexed
    private String fromUserId;

    @Indexed
    private String toUserId;

    private BigDecimal amount;

    @Builder.Default
    private SettlementStatus status = SettlementStatus.PENDING;

    @CreatedDate
    private Instant createdAt;

    private Instant paidAt;
}
