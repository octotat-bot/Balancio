import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    recipientPhone: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    linkedGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }
}, { timestamps: true });

friendSchema.index({ requester: 1, recipientPhone: 1 }, { unique: true });
friendSchema.index({ recipientPhone: 1, status: 1 });

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;
