package com.splitpay.service;

import com.splitpay.document.Expense;
import com.splitpay.document.ExpenseCategory;
import com.splitpay.document.ExpenseParticipant;
import com.splitpay.document.SplitType;
import com.splitpay.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private GroupService groupService;
    @Mock private UserService userService;

    private BalanceService balanceService;

    private static final String GROUP_ID = "group-1";
    private static final String USER_A = "user-a"; // paid 1000, share 500 -> net +500
    private static final String USER_B = "user-b"; // paid 0, share 500 -> net -500

    @BeforeEach
    void setUp() {
        balanceService = new BalanceService(expenseRepository, groupService, userService);
    }

    @Test
    void netBalanceEqualsTotalPaidMinusTotalOwed() {
        Expense expense = Expense.builder()
                .id("exp-1")
                .groupId(GROUP_ID)
                .description("Dinner")
                .amount(new BigDecimal("1000"))
                .category(ExpenseCategory.FOOD)
                .paidBy(USER_A)
                .splitType(SplitType.EQUAL)
                .participants(List.of(
                        ExpenseParticipant.builder().userId(USER_A).amount(new BigDecimal("500")).build(),
                        ExpenseParticipant.builder().userId(USER_B).amount(new BigDecimal("500")).build()
                ))
                .build();

        when(expenseRepository.findByGroupIdOrderByCreatedAtDesc(GROUP_ID)).thenReturn(List.of(expense));

        Map<String, BigDecimal> netBalances = balanceService.computeNetBalances(GROUP_ID, List.of(USER_A, USER_B));

        assertThat(netBalances.get(USER_A)).isEqualByComparingTo("500");
        assertThat(netBalances.get(USER_B)).isEqualByComparingTo("-500");
    }

    @Test
    void memberWithNoExpenseActivityHasZeroBalance() {
        when(expenseRepository.findByGroupIdOrderByCreatedAtDesc(GROUP_ID)).thenReturn(List.of());

        Map<String, BigDecimal> netBalances = balanceService.computeNetBalances(GROUP_ID, List.of(USER_A, USER_B));

        assertThat(netBalances.get(USER_A)).isEqualByComparingTo("0");
        assertThat(netBalances.get(USER_B)).isEqualByComparingTo("0");
    }
}
