const Notification = require('../models/Notification');
const { sendPaymentReminders } = require('../services/notificationService');

/**
 * Get user's notifications
 * GET /notifications
 */
async function getNotifications(req, res) {
    try {
        const userId = req.userId;
        const { unreadOnly, limit = 50 } = req.query;

        const query = { userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate('actorId', 'name')
            .populate('groupId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
}

/**
 * Mark notification as read
 * PUT /notifications/:notificationId/read
 */
async function markAsRead(req, res) {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
}

/**
 * Mark all notifications as read
 * PUT /notifications/read-all
 */
async function markAllAsRead(req, res) {
    try {
        const userId = req.userId;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all as read'
        });
    }
}

/**
 * Delete notification
 * DELETE /notifications/:notificationId
 */
async function deleteNotification(req, res) {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
}

/**
 * Send payment reminders for a group
 * POST /notifications/reminders/:groupId
 */
async function sendReminders(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Verify user is a member/admin of the group
        const GroupMember = require('../models/GroupMember');
        const membership = await GroupMember.findOne({ groupId, userId });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const count = await sendPaymentReminders(groupId);

        res.json({
            success: true,
            message: `Sent ${count} payment reminder(s)`,
            data: { count }
        });
    } catch (error) {
        console.error('Send reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminders'
        });
    }
}

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendReminders
};
