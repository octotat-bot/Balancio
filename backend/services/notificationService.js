const Notification = require('../models/Notification');

/**
 * NOTIFICATION SERVICE
 * Handles creation and management of notifications
 */

/**
 * Create a notification
 */
async function createNotification({ userId, type, title, message, groupId, expenseId, actorId, metadata }) {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            groupId,
            expenseId,
            actorId,
            metadata: metadata || {}
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
}

/**
 * Create notifications for multiple users
 */
async function createBulkNotifications(notifications) {
    try {
        return await Notification.insertMany(notifications);
    } catch (error) {
        console.error('Bulk notification error:', error);
        throw error;
    }
}

/**
 * Notify when expense is added
 */
async function notifyExpenseAdded({ groupId, expenseId, actorId, amount, description, memberIds }) {
    const User = require('../models/User');
    const actor = await User.findById(actorId).select('name');

    const notifications = memberIds
        .filter(memberId => memberId.toString() !== actorId.toString()) // Don't notify the actor
        .map(memberId => ({
            userId: memberId,
            type: 'EXPENSE_ADDED',
            title: 'New Expense Added',
            message: `${actor.name} added "${description}" for ₹${amount}`,
            groupId,
            expenseId,
            actorId,
            metadata: { amount, description }
        }));

    if (notifications.length > 0) {
        await createBulkNotifications(notifications);
    }
}

/**
 * Notify when settlement is recorded
 */
async function notifySettlementRecorded({ groupId, fromUserId, toUserId, amount, actorId }) {
    const User = require('../models/User');
    const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId).select('name'),
        User.findById(toUserId).select('name')
    ]);

    const notifications = [];

    // Notify the person who received money (if they didn't record it)
    if (toUserId.toString() !== actorId.toString()) {
        notifications.push({
            userId: toUserId,
            type: 'SETTLEMENT_RECORDED',
            title: 'Payment Received',
            message: `${fromUser.name} paid you ₹${amount}`,
            groupId,
            actorId,
            metadata: { amount, fromUser: fromUser.name }
        });
    }

    // Notify the person who paid (if they didn't record it)
    if (fromUserId.toString() !== actorId.toString()) {
        notifications.push({
            userId: fromUserId,
            type: 'SETTLEMENT_RECORDED',
            title: 'Payment Recorded',
            message: `Your payment of ₹${amount} to ${toUser.name} was recorded`,
            groupId,
            actorId,
            metadata: { amount, toUser: toUser.name }
        });
    }

    if (notifications.length > 0) {
        await createBulkNotifications(notifications);
    }
}

/**
 * Notify when user is added to group
 */
async function notifyMemberAdded({ groupId, userId, groupName, actorId }) {
    const User = require('../models/User');
    const actor = await User.findById(actorId).select('name');

    await createNotification({
        userId,
        type: 'MEMBER_ADDED',
        title: 'Added to Group',
        message: `${actor.name} added you to "${groupName}"`,
        groupId,
        actorId,
        metadata: { groupName }
    });
}

/**
 * Notify when user is promoted to admin
 */
async function notifyAdminPromoted({ groupId, userId, groupName, actorId }) {
    const User = require('../models/User');
    const actor = await User.findById(actorId).select('name');

    await createNotification({
        userId,
        type: 'ADMIN_PROMOTED',
        title: 'Promoted to Admin',
        message: `${actor.name} made you an admin of "${groupName}"`,
        groupId,
        actorId,
        metadata: { groupName }
    });
}

/**
 * Send payment reminders for outstanding balances
 */
async function sendPaymentReminders(groupId) {
    const { calculateGroupBalances } = require('./balanceService');
    const Group = require('../models/Group');
    const User = require('../models/User');

    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    const balances = await calculateGroupBalances(groupId);

    const notifications = [];

    for (const [userId, data] of Object.entries(balances)) {
        const balance = parseFloat(data.balance);

        // Only remind people who owe money (negative balance)
        if (balance < -0.01) {
            notifications.push({
                userId,
                type: 'PAYMENT_REMINDER',
                title: 'Payment Reminder',
                message: `You owe ₹${Math.abs(balance).toFixed(2)} in "${group.name}"`,
                groupId,
                metadata: {
                    amount: Math.abs(balance).toFixed(2),
                    groupName: group.name
                }
            });
        }
    }

    if (notifications.length > 0) {
        await createBulkNotifications(notifications);
    }

    return notifications.length;
}

module.exports = {
    createNotification,
    createBulkNotifications,
    notifyExpenseAdded,
    notifySettlementRecorded,
    notifyMemberAdded,
    notifyAdminPromoted,
    sendPaymentReminders
};
