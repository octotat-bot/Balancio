import mongoose from 'mongoose';

const splitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
});

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    involved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const expenseSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: 100,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        category: {
            type: String,
            enum: ['food', 'transport', 'entertainment', 'utilities', 'shopping', 'travel', 'health', 'other'],
            default: 'other',
        },
        date: {
            type: Date,
            default: Date.now,
        },
        splitType: {
            type: String,
            enum: ['equal', 'unequal', 'percentage', 'shares', 'itemized'],
            default: 'equal',
        },
        splits: [splitSchema],
        items: [itemSchema],
        notes: {
            type: String,
            maxlength: 500,
        },
        receipt: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
