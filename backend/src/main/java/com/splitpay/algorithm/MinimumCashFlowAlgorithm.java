package com.splitpay.algorithm;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/**
 * Core algorithm behind the "Minimum Cash Flow" feature.
 *
 * MODEL:
 *   Every group member is a node in a directed graph. A debt "A owes B ₹500"
 *   is a directed edge A -> B with weight 500. Net balances are computed first
 *   (paid - owed per user), collapsing all pairwise debts into one number per
 *   person, which is what actually needs settling.
 *
 * ALGORITHM (greedy, using two priority queues):
 *   1. Split users into debtors (net balance < 0) and creditors (net balance > 0).
 *   2. Repeatedly take the biggest debtor and the biggest creditor.
 *   3. Settle min(|debt|, credit) between them; push a settlement transaction.
 *   4. Update both balances; whichever hits zero drops out of its queue.
 *   5. Repeat until both queues are empty.
 *
 * HONESTY NOTE (per project spec):
 *   This greedy approach is NOT guaranteed to produce the mathematically
 *   minimum possible number of transactions for every debt graph — that
 *   general problem (minimum transaction count to zero out a set of balances)
 *   is NP-hard, related to a subset-sum/partition style problem. What this
 *   algorithm DOES guarantee is that the number of resulting transactions is
 *   at most (n - 1), where n is the number of people with a non-zero balance,
 *   which is already a large practical reduction over "every pairwise IOU
 *   settles individually." It's a solid, well-known transaction-reduction
 *   heuristic used by real split-bill apps, not a proof-optimal solver.
 *
 * TIME COMPLEXITY:
 *   Let n = number of members with a non-zero net balance.
 *   - Building the two heaps: O(n log n)
 *   - Each settlement round removes at least one balance entirely, and each
 *     round does O(log n) heap work, so the settlement loop is O(n log n).
 *   - Overall: O(n log n) time, O(n) extra space for the heaps and results.
 */
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
