package com.splitpay.algorithm;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;


public class MinimumCashFlowAlgorithm {

    private static final BigDecimal EPSILON = new BigDecimal("0.01");

    /**
     * @param netBalances map of userId -> net balance (positive = owed money, negative = owes money)
     * @return list of settlement transactions that zero out all balances
     */
    public List<CashFlowTransaction> computeSettlements(Map<String, BigDecimal> netBalances) {
        PriorityQueue<UserBalance> creditors = new PriorityQueue<>(
                Comparator.comparing(UserBalance::getAmount).reversed());
        PriorityQueue<UserBalance> debtors = new PriorityQueue<>(
                Comparator.comparing(UserBalance::getAmount)); // most negative first

        for (Map.Entry<String, BigDecimal> entry : netBalances.entrySet()) {
            BigDecimal amount = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            if (amount.compareTo(EPSILON) > 0) {
                creditors.add(new UserBalance(entry.getKey(), amount));
            } else if (amount.compareTo(EPSILON.negate()) < 0) {
                debtors.add(new UserBalance(entry.getKey(), amount));
            }
            // balances within +/- 1 paisa are treated as already settled
        }

        List<CashFlowTransaction> transactions = new ArrayList<>();

        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            UserBalance biggestCreditor = creditors.poll();
            UserBalance biggestDebtor = debtors.poll();

            BigDecimal creditAmount = biggestCreditor.getAmount();
            BigDecimal debtAmount = biggestDebtor.getAmount().abs();

            BigDecimal settleAmount = creditAmount.min(debtAmount).setScale(2, RoundingMode.HALF_UP);

            if (settleAmount.compareTo(BigDecimal.ZERO) > 0) {
                transactions.add(new CashFlowTransaction(
                        biggestDebtor.getUserId(), biggestCreditor.getUserId(), settleAmount));
            }

            BigDecimal remainingCredit = creditAmount.subtract(settleAmount);
            BigDecimal remainingDebt = debtAmount.subtract(settleAmount);

            if (remainingCredit.compareTo(EPSILON) > 0) {
                biggestCreditor.setAmount(remainingCredit);
                creditors.add(biggestCreditor);
            }
            if (remainingDebt.compareTo(EPSILON) > 0) {
                biggestDebtor.setAmount(remainingDebt.negate());
                debtors.add(biggestDebtor);
            }
        }

        return transactions;
    }
}
