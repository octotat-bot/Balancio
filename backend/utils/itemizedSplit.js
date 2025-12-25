const Decimal = require('decimal.js');

/**
 * Calculate individual shares for itemized bill splitting
 * 
 * @param {Array} items - Array of items with {name, amount, sharedBy}
 * @param {Object} commonCharges - {amount, description}
 * @param {Array} allParticipants - All group members (for common charges)
 * @returns {Object} - Map of userId/guestId to their total share
 */
function calculateItemizedShares(items, commonCharges, allParticipants) {
    const shares = {};

    // Initialize all participants with 0
    allParticipants.forEach(participantId => {
        shares[participantId] = new Decimal(0);
    });

    // Calculate item shares
    items.forEach(item => {
        const itemAmount = new Decimal(item.amount.toString());
        const numSharing = item.sharedBy.length;

        if (numSharing === 0) {
            throw new Error(`Item "${item.name}" has no participants`);
        }

        const sharePerPerson = itemAmount.dividedBy(numSharing);

        item.sharedBy.forEach(participantId => {
            if (!shares[participantId]) {
                shares[participantId] = new Decimal(0);
            }
            shares[participantId] = shares[participantId].plus(sharePerPerson);
        });
    });

    // Add common charges (split equally among ALL participants)
    if (commonCharges && commonCharges.amount) {
        const commonAmount = new Decimal(commonCharges.amount.toString());
        const numParticipants = allParticipants.length;
        const commonSharePerPerson = commonAmount.dividedBy(numParticipants);

        allParticipants.forEach(participantId => {
            shares[participantId] = shares[participantId].plus(commonSharePerPerson);
        });
    }

    // Convert to fixed decimal strings
    const result = {};
    Object.keys(shares).forEach(participantId => {
        result[participantId] = shares[participantId].toFixed(2);
    });

    return result;
}

/**
 * Validate itemized expense data
 */
function validateItemizedExpense(items, commonCharges, participants) {
    if (!items || items.length === 0) {
        throw new Error('Itemized expense must have at least one item');
    }

    items.forEach((item, index) => {
        if (!item.name || !item.name.trim()) {
            throw new Error(`Item ${index + 1} must have a name`);
        }
        if (!item.amount || parseFloat(item.amount) <= 0) {
            throw new Error(`Item "${item.name}" must have a valid amount`);
        }
        if (!item.sharedBy || item.sharedBy.length === 0) {
            throw new Error(`Item "${item.name}" must have at least one person`);
        }
    });

    // Validate that all sharedBy IDs are valid participants
    const participantIds = new Set(participants);
    items.forEach(item => {
        item.sharedBy.forEach(id => {
            if (!participantIds.has(id)) {
                throw new Error(`Invalid participant ID in item "${item.name}"`);
            }
        });
    });

    return true;
}

module.exports = {
    calculateItemizedShares,
    validateItemizedExpense
};
