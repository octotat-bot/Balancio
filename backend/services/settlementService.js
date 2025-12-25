const Decimal = require('decimal.js');

/**
 * SIMPLE DIRECT SETTLEMENTS (NO OPTIMIZATION)
 * 
 * Shows direct debts between people based on their balances
 * If A owes money (negative balance) and B is owed money (positive balance),
 * show A → B payment directly without optimization
 */

/**
 * Create simple direct settlements without optimization
 * @param {Object} balances - Map of userId to balance (Decimal)
 * @returns {Array} - Array of settlement transactions
 */
function simplifySettlements(balances) {
    // Ignore balances below 1 paisa (₹0.01) to handle rounding residuals
    const EPSILON = new Decimal('0.01');

    // Separate creditors and debtors
    const creditors = []; // People who should receive money (balance > 0)
    const debtors = [];   // People who owe money (balance < 0)

    for (const [userId, balance] of Object.entries(balances)) {
        const balanceDecimal = new Decimal(balance);

        if (balanceDecimal.greaterThan(EPSILON)) {
            creditors.push({
                userId,
                amount: balanceDecimal
            });
        } else if (balanceDecimal.lessThan(EPSILON.negated())) {
            debtors.push({
                userId,
                amount: balanceDecimal.abs() // Store as positive for easier calculation
            });
        }
        // Ignore balances within [-0.01, 0.01] range
    }

    const settlements = [];
    let i = 0; // Creditor index
    let j = 0; // Debtor index

    /**
     * Simple matching - pair debtors with creditors
     * No optimization, just settle debts directly
     */
    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];

        // Determine settlement amount (minimum of what's owed and what's due)
        const settlementAmount = Decimal.min(creditor.amount, debtor.amount);

        // Record the transaction
        settlements.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: settlementAmount.toFixed(2) // Round to 2 decimal places for currency
        });

        // Update remaining amounts
        creditor.amount = creditor.amount.minus(settlementAmount);
        debtor.amount = debtor.amount.minus(settlementAmount);

        // Move to next creditor if current one is fully paid
        if (creditor.amount.lessThanOrEqualTo(EPSILON)) {
            i++;
        }

        // Move to next debtor if current one has fully paid
        if (debtor.amount.lessThanOrEqualTo(EPSILON)) {
            j++;
        }
    }

    return settlements;
}

/**
 * Validate settlement algorithm output
 * Ensures total debts equal total credits
 * @param {Array} settlements - Array of settlement transactions
 * @returns {boolean} - True if settlements are valid
 */
function validateSettlements(settlements) {
    const netFlow = {};

    for (const settlement of settlements) {
        const amount = new Decimal(settlement.amount);

        // Debtor sends money (negative flow)
        netFlow[settlement.from] = (netFlow[settlement.from] || new Decimal(0)).minus(amount);

        // Creditor receives money (positive flow)
        netFlow[settlement.to] = (netFlow[settlement.to] || new Decimal(0)).plus(amount);
    }

    // All net flows should be approximately zero
    const EPSILON = new Decimal('0.01');
    for (const flow of Object.values(netFlow)) {
        if (flow.abs().greaterThan(EPSILON)) {
            return false;
        }
    }

    return true;
}

module.exports = {
    simplifySettlements,
    validateSettlements
};
