const Decimal = require('decimal.js');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const GroupMember = require('../models/GroupMember');
const GuestMember = require('../models/GuestMember');

/**
 * EXPENSE SERVICE
 * 
 * Handles all expense creation and validation logic
 * 
 * CRITICAL EDGE CASES HANDLED:
 * 1. Uneven splits (₹100 / 3 = ₹33.34, ₹33.33, ₹33.33)
 * 2. Payer not included in split participants
 * 3. Participants not in group
 * 4. Decimal precision errors
 * 5. Negative or zero amounts
 * 6. Large group sizes
 */

/**
 * Create an expense with equal or itemized split
 * 
 * @param {Object} expenseData - Expense details
 * @param {string} expenseData.groupId - Group ID
 * @param {string} expenseData.paidBy - User ID who paid
 * @param {number|string} expenseData.amount - Total amount
 * @param {string} expenseData.description - Expense description
 * @param {string} expenseData.category - Expense category
 * @param {string} expenseData.splitType - 'EQUAL' or 'ITEMIZED'
 * @param {Array<string>} expenseData.participants - User IDs to split among (for EQUAL)
 * @param {Array} expenseData.items - Items array (for ITEMIZED)
 * @param {Object} expenseData.commonCharges - Common charges (for ITEMIZED)
 * @returns {Promise<Object>} - Created expense with splits
 */
async function createExpense(expenseData) {
    const {
        groupId, paidBy, amount, description, category,
        splitType = 'EQUAL', participants, items, commonCharges
    } = expenseData;

    // Validation 1: Amount must be positive
    const amountDecimal = new Decimal(amount);
    if (amountDecimal.lessThanOrEqualTo(0)) {
        throw new Error('Amount must be greater than 0');
    }

    // Validation 2: Verify payer is a group member
    const payerMembership = await GroupMember.findOne({
        groupId: groupId,
        userId: paidBy
    });

    if (!payerMembership) {
        throw new Error('Payer is not a member of this group');
    }

    let participantIds = [];
    let calculatedShares = {};

    if (splitType === 'ITEMIZED') {
        // For itemized: extract all unique participants from items
        const { validateItemizedExpense, calculateItemizedShares } = require('../utils/itemizedSplit');

        // Get all unique participants from items
        const uniqueParticipants = new Set();
        items.forEach(item => {
            item.sharedBy.forEach(id => uniqueParticipants.add(id));
        });
        participantIds = Array.from(uniqueParticipants);

        // Validate itemized expense
        validateItemizedExpense(items, commonCharges, participantIds);

        // Calculate shares
        calculatedShares = calculateItemizedShares(items, commonCharges, participantIds);
    } else {
        // For equal split: use provided participants
        if (!participants || participants.length === 0) {
            throw new Error('At least one participant is required');
        }
        participantIds = participants;
    }

    // Validation: Verify all participants are group members (User or Guest)
    const groupMembers = await GroupMember.find({
        groupId: groupId,
        userId: { $in: participantIds }
    }).select('userId');
    const validUserIds = groupMembers.map(m => m.userId.toString());

    const guestMembers = await GuestMember.find({
        groupId: groupId,
        _id: { $in: participantIds }
    }).select('_id');
    const validGuestIds = guestMembers.map(m => m._id.toString());

    const validIds = new Set([...validUserIds, ...validGuestIds]);
    const allValid = participantIds.every(id => validIds.has(id));

    if (!allValid) {
        throw new Error('All participants must be members of the group');
    }

    // Create expense and splits
    try {
        // Format items for storage (convert amounts to proper format)
        let formattedItems = undefined;
        if (splitType === 'ITEMIZED' && items) {
            formattedItems = items.map(item => ({
                name: item.name,
                amount: new Decimal(item.amount).toString(),
                sharedBy: item.sharedBy
            }));
        }

        // Format common charges
        let formattedCommonCharges = undefined;
        if (splitType === 'ITEMIZED' && commonCharges && commonCharges.amount) {
            formattedCommonCharges = {
                amount: new Decimal(commonCharges.amount).toString(),
                description: commonCharges.description || 'Tax & Service Charges'
            };
        }

        // Create expense
        const expense = new Expense({
            groupId: groupId,
            amount: amountDecimal.toString(),
            description,
            category: category || 'Other',
            paidBy: paidBy,
            splitType,
            items: formattedItems,
            commonCharges: formattedCommonCharges
        });

        console.log('Creating expense with items:', JSON.stringify(formattedItems, null, 2));

        await expense.save();

        console.log('Saved expense items:', JSON.stringify(expense.items, null, 2));

        // Calculate splits based on type
        let splits;
        if (splitType === 'ITEMIZED') {
            // Use calculated shares from itemized split
            splits = participantIds.map(participantId => ({
                userId: participantId,
                amount: new Decimal(calculatedShares[participantId])
            }));
        } else {
            // Equal split
            splits = calculateEqualSplits(amountDecimal, participantIds);
        }

        // Create expense splits
        const expenseSplits = splits.map(split => {
            const isGuest = validGuestIds.includes(split.userId);
            return {
                expenseId: expense._id,
                userId: isGuest ? null : split.userId,
                guestId: isGuest ? split.userId : null,
                shareAmount: split.amount.toString()
            };
        });

        await ExpenseSplit.insertMany(expenseSplits);


        // Send notifications to group members
        try {
            const { notifyExpenseAdded } = require('./notificationService');
            const GroupMember = require('../models/GroupMember');
            const members = await GroupMember.find({ groupId }).select('userId');
            const memberIds = members.map(m => m.userId).filter(Boolean);

            await notifyExpenseAdded({
                groupId,
                expenseId: expense._id,
                actorId: paidBy,
                amount: amount.toString(),
                description,
                memberIds
            });
        } catch (notifError) {
            console.error('Notification error:', notifError);
            // Don't fail the expense creation if notification fails
        }

        return {
            expense: expense.toJSON(),
            splits: expenseSplits.map(s => ({
                userId: s.userId ? s.userId.toString() : null,
                guestId: s.guestId ? s.guestId.toString() : null,
                shareAmount: s.shareAmount
            }))
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Calculate equal splits with proper rounding
 * 
 * Strategy for uneven division:
 * 1. Calculate base share (floor division)
 * 2. Calculate remainder
 * 3. Distribute remainder to first N participants (1 paisa each)
 * 
 * Example: ₹100 / 3
 * - Base: ₹33.33
 * - Remainder: ₹0.01
 * - Result: [₹33.34, ₹33.33, ₹33.33]
 * - Sum: ₹100.00 ✓
 * 
 * @param {Decimal} totalAmount - Total amount to split
 * @param {Array<string>} participants - User IDs
 * @returns {Array<Object>} - Array of {userId, amount}
 */
function calculateEqualSplits(totalAmount, participants) {
    const participantCount = participants.length;

    // Calculate base share (rounded down to 2 decimal places)
    const baseShare = totalAmount.dividedBy(participantCount).toDecimalPlaces(2, Decimal.ROUND_DOWN);

    // Calculate total of base shares
    const totalBaseShares = baseShare.times(participantCount);

    // Calculate remainder (in paise)
    const remainder = totalAmount.minus(totalBaseShares);
    const remainderPaise = remainder.times(100).toDecimalPlaces(0);

    // Distribute splits
    const splits = [];
    for (let i = 0; i < participantCount; i++) {
        let share = baseShare;

        // Add 1 paisa to first N participants to distribute remainder
        if (i < remainderPaise.toNumber()) {
            share = share.plus(new Decimal('0.01'));
        }

        splits.push({
            userId: participants[i],
            amount: share
        });
    }

    // Validation: Ensure splits sum to total amount
    const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), new Decimal(0));
    if (!splitSum.equals(totalAmount)) {
        throw new Error('Split calculation error: sum does not equal total');
    }

    return splits;
}

/**
 * Get all expenses for a group with pagination, filtering, and search
 * @param {string} groupId - Group ID
 * @param {Object} options - Filter and pagination options
 * @returns {Promise<Array>} - Array of expenses with splits
 */
async function getGroupExpenses(groupId, options = {}) {
    const {
        page = 1,
        limit = 50,
        category,
        search,
        sortBy = 'newest',
        startDate,
        endDate
    } = options;

    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { groupId };

    // Category filter
    if (category && category !== 'All') {
        filter.category = category;
    }

    // Search filter (case-insensitive description search)
    if (search && search.trim()) {
        filter.description = { $regex: search.trim(), $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }

    // Determine sort order
    let sort = {};
    switch (sortBy) {
        case 'oldest':
            sort = { createdAt: 1 };
            break;
        case 'highest':
            sort = { amount: -1 };
            break;
        case 'lowest':
            sort = { amount: 1 };
            break;
        case 'newest':
        default:
            sort = { createdAt: -1 };
            break;
    }

    const expenses = await Expense.find(filter)
        .populate('paidBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    // Fetch splits for all expenses
    const expenseIds = expenses.map(e => e._id);
    const splits = await ExpenseSplit.find({ expenseId: { $in: expenseIds } })
        .populate('userId', 'name email')
        .populate('guestId', 'name')
        .lean();

    // Group splits by expense
    const splitsByExpense = {};
    for (const split of splits) {
        const expenseId = split.expenseId.toString();
        if (!splitsByExpense[expenseId]) {
            splitsByExpense[expenseId] = [];
        }

        const isGuest = !!split.guestId;
        const memberInfo = isGuest ? split.guestId : split.userId;

        splitsByExpense[expenseId].push({
            userId: isGuest ? null : memberInfo?._id.toString(),
            guestId: isGuest ? memberInfo?._id.toString() : null,
            userName: memberInfo?.name || 'Unknown',
            shareAmount: split.shareAmount.toString()
        });
    }

    // Attach splits to expenses
    return expenses.map(expense => {
        // Process items if present
        let processedItems = undefined;
        if (expense.items && expense.items.length > 0) {
            processedItems = expense.items.map(item => ({
                name: item.name,
                amount: item.amount && item.amount.toString ? item.amount.toString() : (item.amount || '0'),
                sharedBy: item.sharedBy,
                _id: item._id
            }));
        }

        // Process common charges if present
        let processedCommonCharges = undefined;
        if (expense.commonCharges) {
            processedCommonCharges = {
                amount: expense.commonCharges.amount && expense.commonCharges.amount.toString
                    ? expense.commonCharges.amount.toString()
                    : (expense.commonCharges.amount || '0'),
                description: expense.commonCharges.description || 'Tax & Service Charges'
            };
        }

        return {
            ...expense,
            _id: expense._id.toString(),
            amount: expense.amount.toString(),
            category: expense.category || 'Other',
            items: processedItems,
            commonCharges: processedCommonCharges,
            paidBy: {
                _id: expense.paidBy._id.toString(),
                name: expense.paidBy.name,
                email: expense.paidBy.email
            },
            splits: splitsByExpense[expense._id.toString()] || []
        };
    });
}

/**
 * Delete an expense and its splits
 * This will trigger balance recalculation on next request
 * @param {string} expenseId - Expense ID
 * @param {string} userId - User requesting deletion (must be payer or group admin)
 * @returns {Promise<void>}
 */
async function deleteExpense(expenseId, userId) {
    try {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }

        // Check if user is group admin
        const Group = require('../models/Group');
        const group = await Group.findById(expense.groupId);
        const isAdmin = group && group.createdBy.toString() === userId;

        // Verify user has permission to delete (is the payer OR group admin)
        if (expense.paidBy.toString() !== userId && !isAdmin) {
            throw new Error('Only the payer or group admin can delete this expense');
        }

        // Delete expense splits
        await ExpenseSplit.deleteMany({ expenseId });

        // Delete expense
        await Expense.findByIdAndDelete(expenseId);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createExpense,
    getGroupExpenses,
    deleteExpense,
    calculateEqualSplits // Exported for testing
};
