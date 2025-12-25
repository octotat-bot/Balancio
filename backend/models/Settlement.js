const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: [true, 'Settlement amount is required'],
        validate: {
            validator: function (value) {
                const numValue = parseFloat(value.toString());
                return numValue > 0;
            },
            message: 'Settlement amount must be greater than 0'
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'CLEARED'],
        default: 'PENDING',
        required: true
    },
    clearedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            if (ret.amount) {
                ret.amount = ret.amount.toString();
            }
            delete ret.__v;
            return ret;
        }
    }
});

settlementSchema.index({ groupId: 1, createdAt: -1 });
settlementSchema.index({ fromUser: 1 });
settlementSchema.index({ toUser: 1 });
settlementSchema.index({ status: 1 });

module.exports = mongoose.model('Settlement', settlementSchema);
