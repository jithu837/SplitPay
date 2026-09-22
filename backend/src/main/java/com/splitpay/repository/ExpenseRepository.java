package com.splitpay.repository;

import com.splitpay.document.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExpenseRepository extends MongoRepository<Expense, String> {
    List<Expense> findByGroupIdOrderByCreatedAtDesc(String groupId);
    List<Expense> findByPaidBy(String userId);
    long countByGroupId(String groupId);
}
