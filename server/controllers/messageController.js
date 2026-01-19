import Message from '../models/Message.js';
import Group from '../models/Group.js';

export const getGroupMessages = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = group.members.includes(req.userId) || group.admins.includes(req.userId);
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to view messages in this group' });
        }

        const messages = await Message.find({ group: groupId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name email avatar');

        res.json({
            messages,
            page,
            hasMore: messages.length === limit
        });
    } catch (error) {
        next(error);
    }
};
