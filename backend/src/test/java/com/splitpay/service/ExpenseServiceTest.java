package com.splitpay.service;

import com.splitpay.document.ExpenseCategory;
import com.splitpay.document.Group;
import com.splitpay.document.SplitType;
import com.splitpay.dto.request.ExpenseParticipantRequest;
import com.splitpay.dto.request.ExpenseRequest;
import com.splitpay.dto.response.ExpenseDto;
import com.splitpay.exception.BadRequestException;
import com.splitpay.repository.ExpenseRepository;
import com.splitpay.repository.GroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private UserService userService;

    private ExpenseService expenseService;

    private static final String GROUP_ID = "group-1";
    private static final String USER_A = "user-a";
    private static final String USER_B = "user-b";
    private static final String USER_C = "user-c";

    @BeforeEach
    void setUp() {
        expenseService = new ExpenseService(expenseRepository, groupRepository, userService);

        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Goa Trip")
                .createdBy(USER_A)
                .memberIds(List.of(USER_A, USER_B, USER_C))
                .build();
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(expenseRepository.save(any())).thenAnswer(inv -> {
            var e = inv.getArgument(0, com.splitpay.document.Expense.class);
            e.setId("expense-1");
            return e;
        });
    }

    private ExpenseRequest baseRequest(SplitType type, List<ExpenseParticipantRequest> participants) {
        ExpenseRequest req = new ExpenseRequest();
        req.setDescription("Hotel");
        req.setAmount(new BigDecimal("3000"));
        req.setCategory(ExpenseCategory.TRAVEL);
        req.setPaidBy(USER_A);
        req.setSplitType(type);
        req.setParticipants(participants);
        return req;
    }

    private ExpenseParticipantRequest participant(String userId, BigDecimal amount, BigDecimal percentage) {
        ExpenseParticipantRequest p = new ExpenseParticipantRequest();
        p.setUserId(userId);
        p.setAmount(amount);
        p.setPercentage(percentage);
        return p;
    }

    @Test
    void equalSplitDividesAmountEvenlyAcrossParticipants() {
        ExpenseRequest req = baseRequest(SplitType.EQUAL, List.of(
                participant(USER_A, null, null),
                participant(USER_B, null, null),
                participant(USER_C, null, null)));

        ExpenseDto result = expenseService.addExpense(GROUP_ID, USER_A, req);

        assertThat(result.getParticipants()).hasSize(3);
        BigDecimal total = result.getParticipants().stream()
                .map(com.splitpay.dto.response.ExpenseParticipantDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(total).isEqualByComparingTo("3000");
        result.getParticipants().forEach(p -> assertThat(p.getAmount()).isEqualByComparingTo("1000"));
    }

    @Test
    void exactSplitAcceptsAmountsThatSumToTotal() {
        ExpenseRequest req = baseRequest(SplitType.EXACT, List.of(
                participant(USER_A, new BigDecimal("1500"), null),
                participant(USER_B, new BigDecimal("1000"), null),
                participant(USER_C, new BigDecimal("500"), null)));

        ExpenseDto result = expenseService.addExpense(GROUP_ID, USER_A, req);

        assertThat(result.getParticipants().get(0).getAmount()).isEqualByComparingTo("1500");
    }

    @Test
    void exactSplitRejectsAmountsThatDoNotSumToTotal() {
        ExpenseRequest req = baseRequest(SplitType.EXACT, List.of(
                participant(USER_A, new BigDecimal("1500"), null),
                participant(USER_B, new BigDecimal("1000"), null),
                participant(USER_C, new BigDecimal("100"), null))); // sums to 2600, not 3000

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, USER_A, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must add up to the total");
    }

    @Test
    void percentageSplitAcceptsPercentagesThatSumTo100() {
        ExpenseRequest req = baseRequest(SplitType.PERCENTAGE, List.of(
                participant(USER_A, null, new BigDecimal("50")),
                participant(USER_B, null, new BigDecimal("30")),
                participant(USER_C, null, new BigDecimal("20"))));

        ExpenseDto result = expenseService.addExpense(GROUP_ID, USER_A, req);

        assertThat(result.getParticipants().get(0).getAmount()).isEqualByComparingTo("1500");
        assertThat(result.getParticipants().get(1).getAmount()).isEqualByComparingTo("900");
        assertThat(result.getParticipants().get(2).getAmount()).isEqualByComparingTo("600");
    }

    @Test
    void percentageSplitRejectsPercentagesThatDoNotSumTo100() {
        ExpenseRequest req = baseRequest(SplitType.PERCENTAGE, List.of(
                participant(USER_A, null, new BigDecimal("50")),
                participant(USER_B, null, new BigDecimal("30")),
                participant(USER_C, null, new BigDecimal("10")))); // sums to 90

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, USER_A, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must add up to 100");
    }

    @Test
    void rejectsDuplicateParticipants() {
        ExpenseRequest req = baseRequest(SplitType.EQUAL, List.of(
                participant(USER_A, null, null),
                participant(USER_A, null, null)));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, USER_A, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Duplicate participant");
    }

    @Test
    void rejectsParticipantNotInGroup() {
        ExpenseRequest req = baseRequest(SplitType.EQUAL, List.of(
                participant(USER_A, null, null),
                participant("stranger-id", null, null)));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, USER_A, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not a member");
    }
}
