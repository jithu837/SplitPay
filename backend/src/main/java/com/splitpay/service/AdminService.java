package com.splitpay.service;

import com.splitpay.document.Expense;
import com.splitpay.document.PaymentStatus;
import com.splitpay.dto.response.AdminStatsResponse;
import com.splitpay.dto.response.UserDto;
import com.splitpay.repository.ExpenseRepository;
import com.splitpay.repository.GroupRepository;
import com.splitpay.repository.PaymentRepository;
import com.splitpay.repository.SettlementRepository;
import com.splitpay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final PaymentRepository paymentRepository;
    private final UserService userService;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(userService::toDto).toList();
    }

    public List<com.splitpay.document.Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public List<Expense> getAllTransactions() {
        return expenseRepository.findAll();
    }

    public AdminStatsResponse getStats() {
        BigDecimal totalExpenseAmount = expenseRepository.findAll().stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> paymentStatusSummary = new LinkedHashMap<>();
        for (PaymentStatus status : PaymentStatus.values()) {
            paymentStatusSummary.put(status.name(), 0L);
        }
        paymentRepository.findAll().forEach(p ->
                paymentStatusSummary.merge(p.getStatus().name(), 1L, Long::sum));

        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalGroups(groupRepository.count())
                .totalExpenses(expenseRepository.count())
                .totalSettlements(settlementRepository.count())
                .totalExpenseAmount(totalExpenseAmount)
                .paymentStatusSummary(paymentStatusSummary)
                .build();
    }
}
