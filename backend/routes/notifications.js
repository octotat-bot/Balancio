const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

/**
 * NOTIFICATION ROUTES
 * All routes require authentication
 */

router.use(authenticate);

// Get notifications
router.get('/', notificationController.getNotifications);

// Mark as read
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Send payment reminders
router.post('/reminders/:groupId', notificationController.sendReminders);

module.exports = router;
