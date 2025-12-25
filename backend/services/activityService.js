const Activity = require('../models/Activity');

/**
 * Log a new activity
 * @param {Object} params
 * @param {string} params.groupId - The group ID
 * @param {string} params.actorId - The user performing the action
 * @param {string} params.action - Enum action type
 * @param {string} params.description - Human readable description
 * @param {string} [params.targetId] - ID of the object being acted upon
 */
async function logActivity({ groupId, actorId, action, description, targetId = null }) {
    try {
        await Activity.create({
            groupId,
            actorId,
            action,
            description,
            targetId
        });
    } catch (error) {
        // We don't want to fail the main request if logging fails, just log the error
        console.error('Failed to log activity:', error);
    }
}

/**
 * Get recent activities for a group
 * @param {string} groupId 
 * @param {number} limit 
 */
async function getGroupActivities(groupId, limit = 20) {
    return Activity.find({ groupId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actorId', 'name email')
        .lean();
}

module.exports = {
    logActivity,
    getGroupActivities
};
