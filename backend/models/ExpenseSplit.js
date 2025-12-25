const mongoose = require('mongoose');

const expenseSplitSchema = new mongoose.Schema({
    expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    guestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GuestMember',
        sparse: true
    },
    shareAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: [true, 'Share amount is required'],
        validate: {
            validator: function (value) {
                const numValue = parseFloat(value.toString());
                return numValue >= 0;
            },
            message: 'Share amount must be non-negative'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            if (ret.shareAmount) {
                ret.shareAmount = ret.shareAmount.toString();
            }
            delete ret.__v;
            return ret;
        }
    }
});

expenseSplitSchema.index({ expenseId: 1 });
expenseSplitSchema.index({ userId: 1 }, { sparse: true });
expenseSplitSchema.index({ guestId: 1 }, { sparse: true });

module.exports = mongoose.model('ExpenseSplit', expenseSplitSchema);
