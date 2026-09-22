package com.splitpay.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Lightweight audit trail for sensitive actions (payment verification,
 * settlement status changes, admin actions).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    private String actorUserId;

    private String action;

    private String targetType;

    private String targetId;

    private String details;

    @CreatedDate
    private Instant createdAt;
}
