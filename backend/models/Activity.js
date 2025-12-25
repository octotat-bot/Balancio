const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'GROUP_CREATED']
    },
    description: {
        type: String,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

activitySchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
