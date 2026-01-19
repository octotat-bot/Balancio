import Expense from '../models/Expense.js';
import DirectExpense from '../models/DirectExpense.js';
import Friend from '../models/Friend.js';
import mongoose from 'mongoose';

export const getAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const groupExpenses = await Expense.find({
            "splits.user": userId,
            date: { $gte: startOfYear }
        }).select('amount date category splits paidBy');

        const friendships = await Friend.find({
            $or: [{ requester: userId }, { recipient: userId }]
        }).select('_id');
        const friendshipIds = friendships.map(f => f._id);

        const directExpenses = await DirectExpense.find({
            friendship: { $in: friendshipIds },
            date: { $gte: startOfYear }
        }).select('amount date category payerShare friendShare paidBy');

        const monthlyData = {};
        const categoryData = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (let i = 0; i < 12; i++) {
            const d = new Date(today.getFullYear(), i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            monthlyData[key] = 0;
        }

        const processExpense = (amount, category, date) => {
            const cat = category || 'General';
            categoryData[cat] = (categoryData[cat] || 0) + amount;

            const d = new Date(date);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (monthlyData.hasOwnProperty(key)) {
                monthlyData[key] += amount;
            }
        };

        groupExpenses.forEach(exp => {
            const mySplit = exp.splits.find(s => s.user.toString() === userId.toString());
            if (mySplit) {
                processExpense(mySplit.amount, exp.category, exp.date);
            }
        });

        directExpenses.forEach(exp => {
            let myShare = 0;
            if (exp.paidBy.toString() === userId.toString()) {
                myShare = exp.payerShare;
            } else {
                myShare = exp.friendShare;
            }
            processExpense(myShare, exp.category, exp.date);
        });

        const categories = Object.entries(categoryData)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const totalGroupExpenses = await Expense.countDocuments({ "splits.user": userId });
        const totalDirectExpenses = await DirectExpense.countDocuments({ friendship: { $in: friendshipIds } });

        res.json({
            history: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
            categories,
            totalExpenses: totalGroupExpenses + totalDirectExpenses
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || email.length < 3) return res.json({ users: [] });

        const User = mongoose.model('User');
        const users = await User.find({
            email: { $regex: email, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('name email').limit(10);

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Search failed' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const User = mongoose.model('User');
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
