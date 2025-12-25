const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: [true, 'Amount is required'],
        validate: {
            validator: function (value) {
                const numValue = parseFloat(value.toString());
                return numValue > 0;
            },
            message: 'Amount must be greater than 0'
        }
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [2, 'Description must be at least 2 characters'],
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    category: {
        type: String,
        enum: ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping', 'Utilities', 'Other'],
        default: 'Other',
        required: true
    },
    splitType: {
        type: String,
        enum: ['EQUAL', 'ITEMIZED'],
        default: 'EQUAL',
        required: true
    },
    items: [{
        name: {
            type: String,
            required: function () { return this.parent().splitType === 'ITEMIZED'; }
        },
        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: function () { return this.parent().splitType === 'ITEMIZED'; }
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'items.participantModel'
        }],
        participantModel: {
            type: String,
            enum: ['User', 'GuestMember']
        }
    }],
    commonCharges: [{
        name: {
            type: String,
            required: true
        },
        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        }
    }],
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            if (ret.amount) {
                ret.amount = ret.amount.toString();
            }
            if (ret.items && Array.isArray(ret.items)) {
                ret.items = ret.items.map(item => ({
                    ...item,
                    amount: item.amount ? item.amount.toString() : '0'
                }));
            }
            if (ret.commonCharges && Array.isArray(ret.commonCharges)) {
                ret.commonCharges = ret.commonCharges.map(charge => ({
                    ...charge,
                    amount: charge.amount ? charge.amount.toString() : '0'
                }));
            }
            delete ret.__v;
            return ret;
        }
    }
});

expenseSchema.index({ groupId: 1, createdAt: -1 });
expenseSchema.index({ paidBy: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
