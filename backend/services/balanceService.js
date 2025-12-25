const Decimal = require('decimal.js');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const GroupMember = require('../models/GroupMember');

/**
 * BALANCE CALCULATION SERVICE
 * 
 * Core Formula: balance = totalPaidByUser - totalOwedByUser
 * 
 * Interpretation:
 * - balance > 0: User should RECEIVE this amount
 * - balance < 0: User should PAY this amount
 * - balance = 0: User is settled
 * 
 * CRITICAL: All calculations use MongoDB aggregation pipelines
 * for performance and accuracy. Never compute in application code.
 */

/**
 * Calculate balances for all members in a group
 * Uses MongoDB aggregation for optimal performance
 * 
 * Formula: balance = (totalPaid - totalOwed) + incomingSettlements - outgoingSettlements
 * 
 * @param {string} groupId - Group ID to calculate balances for
 * @returns {Promise<Object>} - Map of userId to balance
 */
async function calculateGroupBalances(groupId) {
    // Step 1: Get all group members (registered users)
    const members = await GroupMember.find({ groupId })
        .populate('userId', 'name email')
        .lean();

    // Step 1b: Get all guest members
    const GuestMember = require('../models/GuestMember');
    const guestMembers = await GuestMember.find({ groupId })
        .lean();

    if (members.length === 0 && guestMembers.length === 0) {
        return {};
    }

    const memberIds = members.map(m => m.userId._id);
    const guestIds = guestMembers.map(g => g._id);

    // Step 2: Calculate total paid by each user using aggregation
    // Note: Only registered users can pay (paidBy references User model)
    const paidAggregation = await Expense.aggregate([
        {
            $match: {
                groupId: new mongoose.Types.ObjectId(groupId),
                paidBy: { $in: memberIds }
            }
        },
        {
            $group: {
                _id: '$paidBy',
                totalPaid: { $sum: '$amount' }
            }
        }
    ]);

    // Step 3: Calculate total owed by each user AND guest using aggregation
    const owedAggregation = await ExpenseSplit.aggregate([
        {
            // Join with Expense to filter by group
            $lookup: {
                from: 'expenses',
                localField: 'expenseId',
                foreignField: '_id',
                as: 'expense'
            }
        },
        {
            $unwind: '$expense'
        },
        {
            $match: {
                'expense.groupId': new mongoose.Types.ObjectId(groupId),
                $or: [
                    { userId: { $in: memberIds } },
                    { guestId: { $in: guestIds } }
                ]
            }
        },
        {
            $group: {
                _id: {
                    userId: '$userId',
                    guestId: '$guestId'
                },
                totalOwed: { $sum: '$shareAmount' }
            }
        }
    ]);

    // Step 4: Calculate settlements (incoming and outgoing)
    // CRITICAL: Only CLEARED settlements affect balances
    const Settlement = require('../models/Settlement');

    // Incoming settlements (money received)
    const incomingSettlements = await Settlement.aggregate([
        {
            $match: {
                groupId: new mongoose.Types.ObjectId(groupId),
                toUser: { $in: memberIds },
                status: 'CLEARED' // Only cleared settlements
            }
        },
        {
            $group: {
                _id: '$toUser',
                totalReceived: { $sum: '$amount' }
            }
        }
    ]);

    // Outgoing settlements (money paid)
    const outgoingSettlements = await Settlement.aggregate([
        {
            $match: {
                groupId: new mongoose.Types.ObjectId(groupId),
                fromUser: { $in: memberIds },
                status: 'CLEARED' // Only cleared settlements
            }
        },
        {
            $group: {
                _id: '$fromUser',
                totalPaid: { $sum: '$amount' }
            }
        }
    ]);

    // Step 5: Build balance map
    const balances = {};

    // Initialize all registered members with zero balance
    for (const member of members) {
        const userId = member.userId._id.toString();
        balances[userId] = {
            userId,
            userName: member.userId.name,
            userEmail: member.userId.email,
            isGuest: false,
            balance: '0.00',
            totalPaid: '0.00',
            totalOwed: '0.00',
            settlementsReceived: '0.00',
            settlementsPaid: '0.00'
        };
    }

    // Initialize all guest members with zero balance
    for (const guest of guestMembers) {
        const guestId = guest._id.toString();
        balances[guestId] = {
            guestId,
            userName: guest.name,
            isGuest: true,
            balance: '0.00',
            totalPaid: '0.00',
            totalOwed: '0.00',
            settlementsReceived: '0.00',
            settlementsPaid: '0.00'
        };
    }

    // Add paid amounts (only registered users can pay)
    for (const paid of paidAggregation) {
        const userId = paid._id.toString();
        if (balances[userId]) {
            const amount = new Decimal(paid.totalPaid.toString());
            balances[userId].totalPaid = amount.toFixed(2);
        }
    }

    // Add owed amounts (both users and guests)
    for (const owed of owedAggregation) {
        const userId = owed._id.userId ? owed._id.userId.toString() : null;
        const guestId = owed._id.guestId ? owed._id.guestId.toString() : null;
        const id = userId || guestId;

        if (id && balances[id]) {
            const amount = new Decimal(owed.totalOwed.toString());
            balances[id].totalOwed = amount.toFixed(2);
        }
    }

    // Add incoming settlements
    for (const incoming of incomingSettlements) {
        const userId = incoming._id.toString();
        if (balances[userId]) {
            const amount = new Decimal(incoming.totalReceived.toString());
            balances[userId].settlementsReceived = amount.toFixed(2);
        }
    }

    // Add outgoing settlements
    for (const outgoing of outgoingSettlements) {
        const userId = outgoing._id.toString();
        if (balances[userId]) {
            const amount = new Decimal(outgoing.totalPaid.toString());
            balances[userId].settlementsPaid = amount.toFixed(2);
        }
    }

    // Calculate final balances
    // Formula: balance = (paid - owed) + settlementsPaid - settlementsReceived
    // 
    // Logic:
    // - If you owe ₹500 (balance = -500) and pay ₹500 (settlementsPaid), balance becomes 0
    // - If you're owed ₹500 (balance = +500) and receive ₹500 (settlementsReceived), balance becomes 0
    for (const id in balances) {
        const paid = new Decimal(balances[id].totalPaid);
        const owed = new Decimal(balances[id].totalOwed);
        const received = new Decimal(balances[id].settlementsReceived);
        const paidOut = new Decimal(balances[id].settlementsPaid);

        const balance = paid.minus(owed).plus(paidOut).minus(received);
        balances[id].balance = balance.toFixed(2);
    }

    return balances;
}

/**
 * Calculate balance for a single user in a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User balance details
 */
async function calculateUserBalance(groupId, userId) {
    const balances = await calculateGroupBalances(groupId);
    return balances[userId] || null;
}

/**
 * Get group statistics
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} - Group statistics
 */
async function getGroupStats(groupId) {
    const GuestMember = require('../models/GuestMember');

    const [totalExpenseResult, expenseCount, memberCount, guestCount] = await Promise.all([
        Expense.aggregate([
            { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Expense.countDocuments({ groupId: new mongoose.Types.ObjectId(groupId) }),
        GroupMember.countDocuments({ groupId: new mongoose.Types.ObjectId(groupId) }),
        GuestMember.countDocuments({ groupId: new mongoose.Types.ObjectId(groupId) })
    ]);

    const totalExpense = totalExpenseResult.length > 0
        ? new Decimal(totalExpenseResult[0].total.toString()).toFixed(2)
        : '0.00';

    return {
        totalExpense,
        expenseCount,
        memberCount: memberCount + guestCount
    };
}

module.exports = {
    calculateGroupBalances,
    calculateUserBalance,
    getGroupStats
};
