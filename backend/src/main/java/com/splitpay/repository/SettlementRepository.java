package com.splitpay.repository;

import com.splitpay.document.Settlement;
import com.splitpay.document.SettlementStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SettlementRepository extends MongoRepository<Settlement, String> {
    List<Settlement> findByGroupId(String groupId);
    List<Settlement> findByGroupIdAndStatus(String groupId, SettlementStatus status);
    List<Settlement> findByFromUserIdOrToUserId(String fromUserId, String toUserId);
    long countByGroupId(String groupId);
}
