package com.splitpay.service;

import com.splitpay.algorithm.CashFlowTransaction;
import com.splitpay.algorithm.MinimumCashFlowAlgorithm;
import com.splitpay.document.Expense;
import com.splitpay.document.Group;
import com.splitpay.dto.response.CashFlowTransactionDto;
import com.splitpay.dto.response.MinimumCashFlowResponse;
import com.splitpay.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates the minimum-cash-flow feature: pulls raw per-expense debts
 * ("original obligations") for context, computes net balances per member,
 * then delegates the actual greedy settlement computation to
 * MinimumCashFlowAlgorithm.
 */
@Service
@RequiredArgsConstructor
public class MinimumCashFlowService {

    private final ExpenseRepository expenseRepository;
    private final GroupService groupService;
    private final BalanceService balanceService;
    private final UserService userService;
    private final MinimumCashFlowAlgorithm algorithm = new MinimumCashFlowAlgorithm();

    public MinimumCashFlowResponse computeForGroup(String groupId, String requesterId) {
        Group group = groupService.findByIdChecked(groupId, requesterId);

        List<CashFlowTransactionDto> originalObligations = buildOriginalObligations(groupId);

        Map<String, BigDecimal> netBalances = balanceService.computeNetBalances(groupId, group.getMemberIds());
        List<CashFlowTransaction> optimized = algorithm.computeSettlements(netBalances);

        List<CashFlowTransactionDto> optimizedDtos = optimized.stream()
                .map(t -> CashFlowTransactionDto.builder()
                        .fromUserId(t.getFromUserId())
                        .fromUserName(safeName(t.getFromUserId()))
                        .toUserId(t.getToUserId())
                        .toUserName(safeName(t.getToUserId()))
                        .amount(t.getAmount())
                        .build())
                .toList();

        BigDecimal total = optimized.stream()
                .map(CashFlowTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return MinimumCashFlowResponse.builder()
                .originalObligations(originalObligations)
                .optimizedSettlements(optimizedDtos)
                .originalTransactionCount(originalObligations.size())
                .optimizedTransactionCount(optimizedDtos.size())
                .totalSettlementAmount(total)
                .build();
    }

    /**
     * "Original obligations" = one line per (payer, participant) pair across
     * all expenses, i.e. what the raw per-expense debts look like before any
     * netting/optimization. This is shown in the UI purely for comparison —
     * it is NOT what gets settled (net balances are).
     */
    private List<CashFlowTransactionDto> buildOriginalObligations(String groupId) {
        List<CashFlowTransactionDto> result = new java.util.ArrayList<>();
        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);

        for (Expense expense : expenses) {
            for (var participant : expense.getParticipants()) {
                if (participant.getUserId().equals(expense.getPaidBy())) {
                    continue; // payer owing themselves isn't a real obligation
                }
                result.add(CashFlowTransactionDto.builder()
                        .fromUserId(participant.getUserId())
                        .fromUserName(safeName(participant.getUserId()))
                        .toUserId(expense.getPaidBy())
                        .toUserName(safeName(expense.getPaidBy()))
                        .amount(participant.getAmount())
                        .build());
            }
        }
        return result;
    }

    private String safeName(String userId) {
        try {
            return userService.findById(userId).getName();
        } catch (Exception e) {
            return "Unknown user";
        }
    }
}
