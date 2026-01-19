import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    friendship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Friend'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },
    read: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

messageSchema.pre('validate', function (next) {
    if (!this.group && !this.friendship) {
        next(new Error('Message must be associated with either a group or a friendship'));
    } else {
        next();
    }
});

messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ friendship: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
