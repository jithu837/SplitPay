package com.splitpay.algorithm;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MinimumCashFlowAlgorithmTest {

    private final MinimumCashFlowAlgorithm algorithm = new MinimumCashFlowAlgorithm();

    @Test
    void settlesSimpleTwoPersonDebt() {
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        balances.put("A", new BigDecimal("-500"));
        balances.put("B", new BigDecimal("500"));

        List<CashFlowTransaction> result = algorithm.computeSettlements(balances);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFromUserId()).isEqualTo("A");
        assertThat(result.get(0).getToUserId()).isEqualTo("B");
        assertThat(result.get(0).getAmount()).isEqualByComparingTo("500");
    }

    @Test
    void reducesTransactionCountBelowPairwiseCount() {
        // A owes B 300, B owes C 300 -> nets to A owes C 300 (1 txn instead of 2)
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        balances.put("A", new BigDecimal("-300"));
        balances.put("B", new BigDecimal("0"));
        balances.put("C", new BigDecimal("300"));

        List<CashFlowTransaction> result = algorithm.computeSettlements(balances);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFromUserId()).isEqualTo("A");
        assertThat(result.get(0).getToUserId()).isEqualTo("C");
    }

    @Test
    void producesAtMostNMinusOneTransactionsForNPeople() {
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        balances.put("A", new BigDecimal("-1000"));
        balances.put("B", new BigDecimal("-500"));
        balances.put("C", new BigDecimal("300"));
        balances.put("D", new BigDecimal("1200"));

        List<CashFlowTransaction> result = algorithm.computeSettlements(balances);

        long nonZeroMembers = balances.values().stream().filter(v -> v.compareTo(BigDecimal.ZERO) != 0).count();
        assertThat(result.size()).isLessThanOrEqualTo((int) nonZeroMembers - 1);
    }

    @Test
    void allBalancesZeroOutAfterSettlement() {
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        balances.put("A", new BigDecimal("-750"));
        balances.put("B", new BigDecimal("-250"));
        balances.put("C", new BigDecimal("1000"));

        List<CashFlowTransaction> result = algorithm.computeSettlements(balances);

        Map<String, BigDecimal> simulated = new LinkedHashMap<>(balances);
        for (CashFlowTransaction t : result) {
            simulated.merge(t.getFromUserId(), t.getAmount(), BigDecimal::add);
            simulated.merge(t.getToUserId(), t.getAmount().negate(), BigDecimal::add);
        }
        simulated.values().forEach(v -> assertThat(v.abs()).isLessThanOrEqualTo(new BigDecimal("0.01")));
    }

    @Test
    void handlesAlreadySettledGroup() {
        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        balances.put("A", BigDecimal.ZERO);
        balances.put("B", BigDecimal.ZERO);

        List<CashFlowTransaction> result = algorithm.computeSettlements(balances);

        assertThat(result).isEmpty();
    }
}
