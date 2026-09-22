package com.splitpay.service;

import com.splitpay.document.Expense;
import com.splitpay.document.ExpenseParticipant;
import com.splitpay.document.Group;
import com.splitpay.document.SplitType;
import com.splitpay.dto.request.ExpenseParticipantRequest;
import com.splitpay.dto.request.ExpenseRequest;
import com.splitpay.dto.response.ExpenseDto;
import com.splitpay.dto.response.ExpenseParticipantDto;
import com.splitpay.exception.BadRequestException;
import com.splitpay.exception.ForbiddenException;
import com.splitpay.exception.ResourceNotFoundException;
import com.splitpay.repository.ExpenseRepository;
import com.splitpay.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Owns all split-calculation business logic. Every rule here is enforced
 * server-side — the frontend's numbers are never trusted, only used for
 * a friendlier UX before the request lands here.
 */
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private static final BigDecimal ROUNDING_TOLERANCE = new BigDecimal("0.02");

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserService userService;

    public ExpenseDto addExpense(String groupId, String requesterId, ExpenseRequest request) {
        Group group = getGroupOrThrow(groupId, requesterId);

        validateMembership(group, request.getPaidBy(), "Payer");
        validateNoDuplicateParticipants(request.getParticipants());
        for (ExpenseParticipantRequest p : request.getParticipants()) {
            validateMembership(group, p.getUserId(), "Participant");
        }

        List<ExpenseParticipant> computed = computeSplit(request);

        Expense expense = Expense.builder()
                .groupId(groupId)
                .description(request.getDescription().trim())
                .amount(request.getAmount())
                .category(request.getCategory())
                .paidBy(request.getPaidBy())
                .splitType(request.getSplitType())
                .participants(computed)
                .build();

        return toDto(expenseRepository.save(expense));
    }

    public List<ExpenseDto> getExpensesForGroup(String groupId, String requesterId) {
        getGroupOrThrow(groupId, requesterId);
        return expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(this::toDto)
                .toList();
    }

    public ExpenseDto updateExpense(String expenseId, String requesterId, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));

        Group group = getGroupOrThrow(expense.getGroupId(), requesterId);

        validateMembership(group, request.getPaidBy(), "Payer");
        validateNoDuplicateParticipants(request.getParticipants());
        for (ExpenseParticipantRequest p : request.getParticipants()) {
            validateMembership(group, p.getUserId(), "Participant");
        }

        List<ExpenseParticipant> computed = computeSplit(request);

        expense.setDescription(request.getDescription().trim());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setPaidBy(request.getPaidBy());
        expense.setSplitType(request.getSplitType());
        expense.setParticipants(computed);

        return toDto(expenseRepository.save(expense));
    }

    public void deleteExpense(String expenseId, String requesterId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        getGroupOrThrow(expense.getGroupId(), requesterId);
        expenseRepository.delete(expense);
    }

    /**
     * Validates and computes the authoritative per-participant amounts.
     * Frontend-supplied amounts for EQUAL split are ignored and recomputed;
     * for EXACT and PERCENTAGE, the frontend's numbers are checked against
     * the total, not blindly trusted.
     */
    private List<ExpenseParticipant> computeSplit(ExpenseRequest request) {
        BigDecimal total = request.getAmount();
        List<ExpenseParticipantRequest> participants = request.getParticipants();

        return switch (request.getSplitType()) {
            case EQUAL -> computeEqualSplit(total, participants);
            case EXACT -> computeExactSplit(total, participants);
            case PERCENTAGE -> computePercentageSplit(total, participants);
        };
    }

    private List<ExpenseParticipant> computeEqualSplit(BigDecimal total, List<ExpenseParticipantRequest> participants) {
        int n = participants.size();
        BigDecimal share = total.divide(BigDecimal.valueOf(n), 2, RoundingMode.DOWN);
        BigDecimal distributed = share.multiply(BigDecimal.valueOf(n));
        BigDecimal remainder = total.subtract(distributed); // leftover paise from rounding

        List<ExpenseParticipant> result = new java.util.ArrayList<>();
        for (int i = 0; i < n; i++) {
            // Give any leftover paise to the first participant(s) so the total always matches exactly.
            BigDecimal amount = i == 0 ? share.add(remainder) : share;
            result.add(ExpenseParticipant.builder()
                    .userId(participants.get(i).getUserId())
                    .amount(amount)
                    .build());
        }
        return result;
    }

    private List<ExpenseParticipant> computeExactSplit(BigDecimal total, List<ExpenseParticipantRequest> participants) {
        BigDecimal sum = BigDecimal.ZERO;
        List<ExpenseParticipant> result = new java.util.ArrayList<>();

        for (ExpenseParticipantRequest p : participants) {
            if (p.getAmount() == null) {
                throw new BadRequestException("Each participant needs an exact amount for EXACT split");
            }
            if (p.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Participant amounts cannot be negative");
            }
            sum = sum.add(p.getAmount());
            result.add(ExpenseParticipant.builder()
                    .userId(p.getUserId())
                    .amount(p.getAmount().setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        if (sum.subtract(total).abs().compareTo(ROUNDING_TOLERANCE) > 0) {
            throw new BadRequestException(
                    "Exact split amounts (" + sum + ") must add up to the total expense amount (" + total + ")");
        }
        return result;
    }

    private List<ExpenseParticipant> computePercentageSplit(BigDecimal total, List<ExpenseParticipantRequest> participants) {
        BigDecimal percentSum = BigDecimal.ZERO;
        List<ExpenseParticipant> result = new java.util.ArrayList<>();

        for (ExpenseParticipantRequest p : participants) {
            if (p.getPercentage() == null) {
                throw new BadRequestException("Each participant needs a percentage for PERCENTAGE split");
            }
            if (p.getPercentage().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Percentages cannot be negative");
            }
            percentSum = percentSum.add(p.getPercentage());
        }

        if (percentSum.subtract(BigDecimal.valueOf(100)).abs().compareTo(new BigDecimal("0.5")) > 0) {
            throw new BadRequestException("Percentages must add up to 100 (got " + percentSum + ")");
        }

        BigDecimal distributed = BigDecimal.ZERO;
        for (int i = 0; i < participants.size(); i++) {
            ExpenseParticipantRequest p = participants.get(i);
            BigDecimal amount;
            if (i == participants.size() - 1) {
                // last participant absorbs any rounding remainder so the total matches exactly
                amount = total.subtract(distributed).setScale(2, RoundingMode.HALF_UP);
            } else {
                amount = total.multiply(p.getPercentage())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                distributed = distributed.add(amount);
            }
            result.add(ExpenseParticipant.builder()
                    .userId(p.getUserId())
                    .amount(amount)
                    .percentage(p.getPercentage())
                    .build());
        }
        return result;
    }

    private void validateNoDuplicateParticipants(List<ExpenseParticipantRequest> participants) {
        Set<String> seen = new HashSet<>();
        for (ExpenseParticipantRequest p : participants) {
            if (!seen.add(p.getUserId())) {
                throw new BadRequestException("Duplicate participant in split: " + p.getUserId());
            }
        }
    }

    private void validateMembership(Group group, String userId, String label) {
        if (!group.getMemberIds().contains(userId)) {
            throw new BadRequestException(label + " (" + userId + ") is not a member of this group");
        }
    }

    private Group getGroupOrThrow(String groupId, String requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        if (!group.getMemberIds().contains(requesterId)) {
            throw new ForbiddenException("You are not a member of this group");
        }
        return group;
    }

    public ExpenseDto toDto(Expense expense) {
        List<ExpenseParticipantDto> participantDtos = expense.getParticipants().stream()
                .map(p -> ExpenseParticipantDto.builder()
                        .userId(p.getUserId())
                        .userName(safeUserName(p.getUserId()))
                        .amount(p.getAmount())
                        .percentage(p.getPercentage())
                        .build())
                .toList();

        return ExpenseDto.builder()
                .id(expense.getId())
                .groupId(expense.getGroupId())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .category(expense.getCategory())
                .paidBy(expense.getPaidBy())
                .paidByName(safeUserName(expense.getPaidBy()))
                .splitType(expense.getSplitType())
                .participants(participantDtos)
                .createdAt(expense.getCreatedAt())
                .build();
    }

    private String safeUserName(String userId) {
        try {
            return userService.findById(userId).getName();
        } catch (ResourceNotFoundException e) {
            return "Unknown user";
        }
    }
}
