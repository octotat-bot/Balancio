const mongoose = require('mongoose');
const GroupMember = require('../models/GroupMember');
const { createExpense, getGroupExpenses, deleteExpense } = require('../services/expenseService');

/**
 * EXPENSE CONTROLLER
 * Handles expense creation, retrieval, and deletion
 */

/**
 * Create a new expense
 * POST /expenses
 */
async function create(req, res) {
    try {
        const { groupId, amount, description, participants, category, splitType, items, commonCharges } = req.body;
        const userId = req.userId;

        // Validation
        if (!groupId || !amount || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide groupId, amount, and description'
            });
        }

        // For EQUAL split, participants are required
        if (splitType === 'EQUAL' || !splitType) {
            if (!participants || !Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Participants must be a non-empty array for equal split'
                });
            }
        }

        // For ITEMIZED split, items are required
        if (splitType === 'ITEMIZED') {
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Items must be provided for itemized split'
                });
            }
        }

        // Verify user is a member of the group
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Create expense
        const result = await createExpense({
            groupId,
            paidBy: userId,
            amount,
            description,
            category: category || 'Other',
            splitType: splitType || 'EQUAL',
            participants,
            items,
            commonCharges
        });

        // Log Activity
        const activityService = require('../services/activityService');
        const splitLabel = splitType === 'ITEMIZED' ? ' (itemized)' : '';
        await activityService.logActivity({
            groupId: groupId,
            actorId: userId,
            action: 'EXPENSE_CREATED',
            description: `added expense "${description}" of ₹${amount}${splitLabel}`,
            targetId: result.expense._id
        });

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: result
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expense',
            error: error.message
        });
    }
}

/**
 * Get expenses for a group with filtering and search
 * GET /groups/:groupId/expenses
 * Query params: page, limit, category, search, sortBy, startDate, endDate
 */
async function getExpenses(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;
        const { page, limit, category, search, sortBy, startDate, endDate } = req.query;

        // Verify user is a member
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Build filter options
        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            category,
            search,
            sortBy: sortBy || 'newest', // newest, oldest, highest, lowest
            startDate,
            endDate
        };

        // Get expenses with filters
        const expenses = await getGroupExpenses(groupId, options);

        res.json({
            success: true,
            data: { expenses }
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get expenses',
            error: error.message
        });
    }
}

/**
 * Update an expense
 * PUT /expenses/:expenseId
 */
async function update(req, res) {
    try {
        const { expenseId } = req.params;
        const { amount, description, participants } = req.body;
        const userId = req.userId;

        // Validation
        if (!amount || !description || !participants) {
            return res.status(400).json({
                success: false,
                message: 'Please provide amount, description, and participants'
            });
        }

        if (!Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Participants must be a non-empty array'
            });
        }

        // Import models
        const Expense = require('../models/Expense');
        const ExpenseSplit = require('../models/ExpenseSplit');
        const GuestMember = require('../models/GuestMember');
        const Decimal = require('decimal.js');

        // Get the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Check if user is group admin
        const Group = require('../models/Group');
        const group = await Group.findById(expense.groupId);
        const isAdmin = group && group.createdBy.toString() === userId;

        // Verify user is either the payer OR the group admin
        if (expense.paidBy.toString() !== userId && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only the payer or group admin can edit this expense'
            });
        }

        // Delete old splits
        await ExpenseSplit.deleteMany({ expenseId });

        // Update expense
        const amountDecimal = new Decimal(amount);
        expense.amount = amountDecimal.toString();
        expense.description = description;
        await expense.save();

        // Calculate equal splits (same logic as createExpense)
        const numParticipants = participants.length;
        const shareAmount = amountDecimal.dividedBy(numParticipants);
        const roundedShare = shareAmount.toDecimalPlaces(2, Decimal.ROUND_DOWN);
        const remainder = amountDecimal.minus(roundedShare.times(numParticipants));

        // Check which participants are guests
        const guestMembers = await GuestMember.find({
            groupId: expense.groupId,
            _id: { $in: participants }
        }).select('_id');
        const validGuestIds = guestMembers.map(m => m._id.toString());

        // Create new splits
        const expenseSplits = participants.map((participantId, index) => {
            const isGuest = validGuestIds.includes(participantId);
            let share = roundedShare;

            // Add remainder to first participant
            if (index === 0) {
                share = share.plus(remainder);
            }

            return {
                expenseId: expense._id,
                userId: isGuest ? null : participantId,
                guestId: isGuest ? participantId : null,
                shareAmount: share.toString()
            };
        });

        await ExpenseSplit.insertMany(expenseSplits);

        // Log Activity
        const activityService = require('../services/activityService');
        await activityService.logActivity({
            groupId: expense.groupId,
            actorId: userId,
            action: 'EXPENSE_CREATED',
            description: `updated expense "${description}" to ₹${amount}`,
            targetId: expenseId
        });

        res.json({
            success: true,
            message: 'Expense updated successfully'
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense',
            error: error.message
        });
    }
}

/**
 * Delete an expense
 * DELETE /expenses/:expenseId
 */
async function remove(req, res) {
    try {
        const { expenseId } = req.params;
        const userId = req.userId;

        await deleteExpense(expenseId, userId);

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);

        if (error.message === 'Expense not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Only the payer or group admin can delete this expense') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete expense',
            error: error.message
        });
    }
}

module.exports = {
    create,
    getExpenses,
    update,
    remove
};
