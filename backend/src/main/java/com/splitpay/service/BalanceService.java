package com.splitpay.service;

import com.splitpay.document.Expense;
import com.splitpay.document.ExpenseParticipant;
import com.splitpay.document.Group;
import com.splitpay.dto.response.BalanceDto;
import com.splitpay.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Computes per-user balances within a group:
 *   netBalance = totalPaid - totalOwed
 * Positive => user should receive money. Negative => user owes money.
 */
@Service
@RequiredArgsConstructor
public class BalanceService {

    private static final BigDecimal EPSILON = new BigDecimal("0.01");

    private final ExpenseRepository expenseRepository;
    private final GroupService groupService;
    private final UserService userService;

    public List<BalanceDto> getGroupBalances(String groupId, String requesterId) {
        Group group = groupService.findByIdChecked(groupId, requesterId);
        Map<String, BigDecimal> netBalances = computeNetBalances(groupId, group.getMemberIds());
        Map<String, BigDecimal> totalPaid = computeTotalPaid(groupId, group.getMemberIds());
        Map<String, BigDecimal> totalOwed = computeTotalOwed(groupId, group.getMemberIds());

        List<BalanceDto> result = new java.util.ArrayList<>();
        for (String userId : group.getMemberIds()) {
            BigDecimal net = netBalances.getOrDefault(userId, BigDecimal.ZERO);
            String status = net.compareTo(EPSILON) > 0 ? "GETS_BACK"
                    : net.compareTo(EPSILON.negate()) < 0 ? "OWES" : "SETTLED";

            result.add(BalanceDto.builder()
                    .userId(userId)
                    .userName(safeName(userId))
                    .totalPaid(totalPaid.getOrDefault(userId, BigDecimal.ZERO))
                    .totalOwed(totalOwed.getOrDefault(userId, BigDecimal.ZERO))
                    .netBalance(net)
                    .status(status)
                    .build());
        }
        return result;
    }

    /** userId -> (totalPaid - totalOwed) for every member with any expense activity. */
    public Map<String, BigDecimal> computeNetBalances(String groupId, List<String> memberIds) {
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        for (String id : memberIds) {
            balances.put(id, BigDecimal.ZERO);
        }

        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        for (Expense expense : expenses) {
            balances.merge(expense.getPaidBy(), expense.getAmount(), BigDecimal::add);
            for (ExpenseParticipant p : expense.getParticipants()) {
                balances.merge(p.getUserId(), p.getAmount().negate(), BigDecimal::add);
            }
        }

        balances.replaceAll((k, v) -> v.setScale(2, RoundingMode.HALF_UP));
        return balances;
    }

    private Map<String, BigDecimal> computeTotalPaid(String groupId, List<String> memberIds) {
        Map<String, BigDecimal> paid = new LinkedHashMap<>();
        for (String id : memberIds) paid.put(id, BigDecimal.ZERO);

        for (Expense e : expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            paid.merge(e.getPaidBy(), e.getAmount(), BigDecimal::add);
        }
        paid.replaceAll((k, v) -> v.setScale(2, RoundingMode.HALF_UP));
        return paid;
    }

    private Map<String, BigDecimal> computeTotalOwed(String groupId, List<String> memberIds) {
        Map<String, BigDecimal> owed = new LinkedHashMap<>();
        for (String id : memberIds) owed.put(id, BigDecimal.ZERO);

        for (Expense e : expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            for (ExpenseParticipant p : e.getParticipants()) {
                owed.merge(p.getUserId(), p.getAmount(), BigDecimal::add);
            }
        }
        owed.replaceAll((k, v) -> v.setScale(2, RoundingMode.HALF_UP));
        return owed;
    }

    private String safeName(String userId) {
        try {
            return userService.findById(userId).getName();
        } catch (Exception e) {
            return "Unknown user";
        }
    }
}
