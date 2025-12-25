const mongoose = require('mongoose');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const { calculateGroupBalances, getGroupStats } = require('../services/balanceService');
const { simplifySettlements } = require('../services/settlementService');

/**
 * GROUP CONTROLLER
 * Handles group creation, member management, and group queries
 */

/**
 * Create a new group
 * POST /groups
 */
async function createGroup(req, res) {
    try {
        const { name, description, category } = req.body;
        const userId = req.userId;

        // Validation
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Group name must be at least 2 characters'
            });
        }

        // Create group
        const group = new Group({
            name: name.trim(),
            description: description?.trim() || '',
            category: category || 'other',
            createdBy: userId,
            admins: [userId] // Creator is the first admin
        });

        await group.save();

        // Add creator as first member
        const membership = new GroupMember({
            groupId: group._id,
            userId: userId
        });

        await membership.save();

        // Log Activity
        const activityService = require('../services/activityService');
        await activityService.logActivity({
            groupId: group._id,
            actorId: userId,
            action: 'GROUP_CREATED',
            description: `created the group "${name}"`
        });

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: { group: group.toJSON() }
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group',
            error: error.message
        });
    }
}

/**
 * Get group details
 * GET /groups/:groupId
 */
async function getGroup(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Verify user is a member
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Get group details
        const group = await Group.findById(groupId)
            .populate('createdBy', 'name email')
            .populate('admins', 'name email')
            .lean();

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Ensure admins array exists (for old groups created before this feature)
        if (!group.admins || group.admins.length === 0) {
            group.admins = [group.createdBy];
            await Group.findByIdAndUpdate(groupId, { admins: [group.createdBy._id] });
        }


        // Get registered members
        const members = await GroupMember.find({ groupId })
            .populate('userId', 'name email')
            .lean();

        // Get guest members
        const GuestMember = require('../models/GuestMember');
        const guestMembers = await GuestMember.find({ groupId }).lean();

        // Combine all members
        const allMembers = [
            ...members.map(m => ({
                _id: m._id.toString(),
                userId: m.userId._id.toString(),
                userName: m.userId.name,
                userEmail: m.userId.email,
                joinedAt: m.joinedAt,
                isGuest: false
            })),
            ...guestMembers.map(g => ({
                _id: g._id.toString(),
                guestId: g._id.toString(),
                userName: g.name,
                phone: g.phone,
                joinedAt: g.joinedAt,
                isGuest: true
            }))
        ];


        // Get stats
        const stats = await getGroupStats(groupId);

        // Check if current user is an admin
        const isAdmin = group.admins.some(admin => admin._id.toString() === userId);

        res.json({
            success: true,
            data: {
                group: {
                    ...group,
                    _id: group._id.toString(),
                    createdBy: {
                        _id: group.createdBy._id.toString(),
                        name: group.createdBy.name,
                        email: group.createdBy.email
                    },
                    members: allMembers,
                    stats,
                    isAdmin
                }
            }
        });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get group',
            error: error.message
        });
    }
}

/**
 * Get all groups for current user
 * GET /groups
 */
async function getUserGroups(req, res) {
    try {
        const userId = req.userId;
        const { includeArchived } = req.query; // Optional query param

        // Get all group memberships
        const memberships = await GroupMember.find({
            userId: userId
        }).lean();

        const groupIds = memberships.map(m => m.groupId);

        // Build query - filter by archive status
        const query = { _id: { $in: groupIds } };
        if (includeArchived === 'true') {
            // Show ONLY archived groups
            query.isArchived = true;
        } else {
            // Show ONLY active (non-archived) groups
            query.isArchived = { $ne: true };
        }

        // Get group details
        const groups = await Group.find(query)
            .populate('createdBy', 'name email')
            .populate('admins', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Separate active and archived groups
        const activeGroups = groups.filter(g => !g.isArchived);
        const archivedGroups = groups.filter(g => g.isArchived);

        // Get stats for each group
        const groupsWithStats = await Promise.all(
            groups.map(async (group) => {
                const stats = await getGroupStats(group._id);
                return {
                    ...group,
                    _id: group._id.toString(),
                    stats,
                    isAdmin: group.admins.some(admin => admin._id.toString() === userId)
                };
            })
        );

        res.json({
            success: true,
            data: {
                groups: groupsWithStats,
                activeCount: activeGroups.length,
                archivedCount: archivedGroups.length
            }
        });
    } catch (error) {
        console.error('Get user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get groups',
            error: error.message
        });
    }
}

/**
 * Add member to group
 * POST /groups/:groupId/members
 * Supports adding by email (registered user) or by name+phone
 * If adding by phone:
 * 1. Checks if a registered user exists with that phone -> Adds as Registered Member
 * 2. Checks if guest exists -> Adds as Guest Member
 */
async function addMember(req, res) {
    try {
        const { groupId } = req.params;
        const { email, name, phone } = req.body;
        const userId = req.userId;

        // Validation - need either email OR (name + phone)
        if (!email && (!name || !phone)) {
            return res.status(400).json({
                success: false,
                message: 'Either email OR (name and phone) is required'
            });
        }

        const User = require('../models/User');
        const GuestMember = require('../models/GuestMember');

        // Verify requester is the group creator (Admin)
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the group admin can add members'
            });
        }

        // --- SCENARIO 1: Email Provided ---
        if (email) {
            const newUser = await User.findOne({ email: email.toLowerCase() });

            if (!newUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found with this email.'
                });
            }

            // Check if already a member
            const existingMembership = await GroupMember.findOne({
                groupId: groupId,
                userId: newUser._id
            });

            if (existingMembership) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already a member of this group'
                });
            }

            // Add registered member
            const membership = new GroupMember({
                groupId: groupId,
                userId: newUser._id
            });
            await membership.save();

            // Log Activity
            const activityService = require('../services/activityService');
            await activityService.logActivity({
                groupId: groupId,
                actorId: userId,
                action: 'MEMBER_ADDED',
                description: `added ${newUser.name} to the group`,
                targetId: newUser._id
            });

            // Send notification to new member
            try {
                const { notifyMemberAdded } = require('../services/notificationService');
                const group = await Group.findById(groupId).select('name');
                await notifyMemberAdded({
                    groupId,
                    userId: newUser._id,
                    groupName: group.name,
                    actorId: userId
                });
            } catch (notifError) {
                console.error('Notification error:', notifError);
            }

            return res.status(201).json({
                success: true,
                message: 'Member added successfully',
                data: {
                    member: {
                        userId: newUser._id.toString(),
                        userName: newUser.name,
                        userEmail: newUser.email,
                        joinedAt: membership.joinedAt,
                        isGuest: false
                    }
                }
            });
        }

        // --- SCENARIO 2: Name + Phone Provided ---
        if (name && phone) {
            const cleanPhone = phone.trim();

            // Step A: Check if this phone belongs to an existing REGISTERED User
            const existingUser = await User.findOne({ phone: cleanPhone });

            if (existingUser) {
                // User exists! Add them as a proper Member, not a guest.
                const existingMembership = await GroupMember.findOne({
                    groupId: groupId,
                    userId: existingUser._id
                });

                if (existingMembership) {
                    return res.status(400).json({
                        success: false,
                        message: 'A registered user with this phone is already in the group'
                    });
                }

                // Add as Registered Member
                const membership = new GroupMember({
                    groupId: groupId,
                    userId: existingUser._id
                });
                await membership.save();

                return res.status(201).json({
                    success: true,
                    message: 'Member added successfully (Matched existing account)',
                    data: {
                        member: {
                            userId: existingUser._id.toString(),
                            userName: existingUser.name,
                            userEmail: existingUser.email,
                            joinedAt: membership.joinedAt,
                            isGuest: false
                        }
                    }
                });
            }

            // Step B: User does not exist. Add as Guest Member.

            // Check if guest with same phone already exists
            const existingGuest = await GuestMember.findOne({
                groupId: groupId,
                phone: cleanPhone
            });

            if (existingGuest) {
                return res.status(400).json({
                    success: false,
                    message: 'A guest member with this phone already exists'
                });
            }

            // Create Guest Member
            const guestMember = new GuestMember({
                groupId: groupId,
                name: name.trim(),
                phone: cleanPhone,
                addedBy: userId
            });
            await guestMember.save();

            // Log Activity
            const activityService = require('../services/activityService');
            await activityService.logActivity({
                groupId: groupId,
                actorId: userId,
                action: 'MEMBER_ADDED',
                description: `added guest "${name.trim()}" to the group`,
                targetId: guestMember._id
            });

            return res.status(201).json({
                success: true,
                message: 'Guest member added successfully',
                data: {
                    member: {
                        guestId: guestMember._id.toString(),
                        userName: guestMember.name,
                        phone: guestMember.phone,
                        joinedAt: guestMember.joinedAt,
                        isGuest: true
                    }
                }
            });
        }
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add member',
            error: error.message
        });
    }
}


/**
 * Get group balances
 * GET /groups/:groupId/balances
 */
async function getBalances(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Verify user is a member
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Calculate balances
        const balances = await calculateGroupBalances(groupId);

        res.json({
            success: true,
            data: { balances: Object.values(balances) }
        });
    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balances',
            error: error.message
        });
    }
}

/**
 * Get settlement plan
 * GET /groups/:groupId/settlement
 */
async function getSettlement(req, res) {
    try {
        const { groupId } = req.params;
        const { optimize } = req.query; // Get optimize flag from query
        const userId = req.userId;

        // Verify user is a member
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        let settlements = [];

        if (optimize === 'true') {
            // OPTIMIZED MODE: Use balance consolidation
            const balances = await calculateGroupBalances(groupId);

            // Convert to simple balance map
            const balanceMap = {};
            for (const [userId, data] of Object.entries(balances)) {
                balanceMap[userId] = data.balance;
            }

            // Calculate optimized settlements
            const optimizedSettlements = simplifySettlements(balanceMap);

            // Enrich with user details
            settlements = optimizedSettlements.map(settlement => {
                const fromUser = balances[settlement.from];
                const toUser = balances[settlement.to];

                return {
                    from: {
                        userId: settlement.from,
                        userName: fromUser.userName
                    },
                    to: {
                        userId: settlement.to,
                        userName: toUser.userName
                    },
                    amount: settlement.amount,
                    expenseDescription: null // No specific expense in optimized mode
                };
            });
        } else {
            // INDIVIDUAL MODE: Show all expense debts
            const Expense = require('../models/Expense');
            const ExpenseSplit = require('../models/ExpenseSplit');

            const expenses = await Expense.find({ groupId }).populate('paidBy', 'name');

            // For each expense, show who owes the payer
            for (const expense of expenses) {
                const splits = await ExpenseSplit.find({ expenseId: expense._id })
                    .populate('userId', 'name')
                    .populate('guestId', 'name');

                for (const split of splits) {
                    const splitUserId = split.userId?._id.toString() || split.guestId?._id.toString();
                    const splitUserName = split.userId?.name || split.guestId?.name;
                    const payerId = expense.paidBy._id.toString();

                    // Skip if the person who paid is the same as the person who owes
                    if (splitUserId === payerId) {
                        continue;
                    }

                    // Add individual debt
                    settlements.push({
                        from: {
                            userId: splitUserId,
                            userName: splitUserName
                        },
                        to: {
                            userId: payerId,
                            userName: expense.paidBy.name
                        },
                        amount: split.shareAmount.toString(),
                        expenseDescription: expense.description
                    });
                }
            }
        }

        res.json({
            success: true,
            data: {
                settlements: settlements,
                totalTransactions: settlements.length,
                optimized: optimize === 'true'
            }
        });
    } catch (error) {
        console.error('Get settlement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settlement',
            error: error.message
        });
    }
}

/**
 * Record a settlement (repayment)
 * POST /groups/:groupId/settlements
 */
async function recordSettlement(req, res) {
    try {
        const { groupId } = req.params;
        const { fromUser, toUser, amount } = req.body;
        const userId = req.userId;

        // Validation
        if (!fromUser || !toUser || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide fromUser, toUser, and amount'
            });
        }

        if (parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Verify user is a member
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Create settlement
        const Settlement = require('../models/Settlement');
        const Decimal = require('decimal.js');

        const settlement = new Settlement({
            groupId,
            fromUser,
            toUser,
            amount: new Decimal(amount).toString(),
            status: 'CLEARED',
            clearedAt: new Date()
        });

        await settlement.save();

        // Get user names for activity log
        const fromMember = await GroupMember.findOne({ groupId, userId: fromUser }).populate('userId', 'name');
        const toMember = await GroupMember.findOne({ groupId, userId: toUser }).populate('userId', 'name');

        // Log Activity
        const activityService = require('../services/activityService');
        await activityService.logActivity({
            groupId: groupId,
            actorId: userId,
            action: 'EXPENSE_CREATED', // Reusing this action type
            description: `recorded settlement: ${fromMember?.userId?.name || 'Unknown'} paid ${toMember?.userId?.name || 'Unknown'} ₹${amount}`,
            targetId: settlement._id
        });

        // Send notifications
        try {
            const { notifySettlementRecorded } = require('../services/notificationService');
            await notifySettlementRecorded({
                groupId,
                fromUserId: fromUser,
                toUserId: toUser,
                amount,
                actorId: userId
            });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Settlement recorded successfully',
            data: { settlement }
        });
    } catch (error) {
        console.error('Record settlement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record settlement',
            error: error.message
        });
    }
}

/**
 * Undo a settlement
 * DELETE /groups/:groupId/settlements/:settlementId
 */
async function undoSettlement(req, res) {
    try {
        const { groupId, settlementId } = req.params;
        const userId = req.userId;

        // Find the settlement
        const Settlement = require('../models/Settlement');
        const settlement = await Settlement.findOne({
            _id: settlementId,
            groupId: groupId,
            status: 'CLEARED'
        });

        if (!settlement) {
            return res.status(404).json({
                success: false,
                message: 'Settlement not found or already undone'
            });
        }

        // Check if user is involved in the settlement
        if (settlement.fromUser.toString() !== userId && settlement.toUser.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only undo settlements you are involved in'
            });
        }

        // Check if settlement is recent (within 24 hours)
        const hoursSinceCleared = (Date.now() - settlement.clearedAt) / (1000 * 60 * 60);
        if (hoursSinceCleared > 24) {
            return res.status(400).json({
                success: false,
                message: 'Can only undo settlements within 24 hours of recording'
            });
        }

        // Delete the settlement
        await Settlement.findByIdAndDelete(settlementId);

        // Log Activity
        const activityService = require('../services/activityService');
        const User = require('../models/User');
        const actor = await User.findById(userId).select('name');

        await activityService.logActivity({
            groupId: groupId,
            actorId: userId,
            action: 'EXPENSE_CREATED', // Reusing this action type
            description: `undid a settlement of ₹${settlement.amount}`,
            targetId: settlementId
        });

        res.json({
            success: true,
            message: 'Settlement undone successfully'
        });
    } catch (error) {
        console.error('Undo settlement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to undo settlement',
            error: error.message
        });
    }
}

/**
 * Get user's settlements (both pending and cleared)
 * GET /groups/:groupId/user-settlements
 */
async function getUserSettlements(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Verify user is a member
        const membership = await GroupMember.findOne({
            groupId: groupId,
            userId: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        const Settlement = require('../models/Settlement');
        const User = require('../models/User');

        // Get all settlements involving this user
        const settlements = await Settlement.find({
            groupId: groupId,
            $or: [
                { fromUser: userId },
                { toUser: userId }
            ]
        })
            .populate('fromUser', 'name')
            .populate('toUser', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Separate into pending and cleared
        const pending = settlements.filter(s => s.status === 'PENDING');
        const cleared = settlements.filter(s => s.status === 'CLEARED');

        res.json({
            success: true,
            data: {
                pending,
                cleared,
                settlements, // All settlements for history view
                total: settlements.length
            }
        });
    } catch (error) {
        console.error('Get user settlements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settlements',
            error: error.message
        });
    }
}

/**
 * Get group recent activity log
 * GET /groups/:groupId/activity
 */
async function getActivities(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Verify membership
        const GroupMember = require('../models/GroupMember');
        const membership = await GroupMember.findOne({ groupId, userId });

        if (!membership) {
            return res.status(403).json({ success: false, message: 'Not a member' });
        }

        const activityService = require('../services/activityService');
        const allActivities = await activityService.getGroupActivities(groupId);

        // Check if user is group admin
        const Group = require('../models/Group');
        const group = await Group.findById(groupId);
        const isAdmin = group && group.createdBy.toString() === userId;

        // If admin, show all activities
        if (isAdmin) {
            return res.json({
                success: true,
                data: { activities: allActivities }
            });
        }

        // For regular members: filter settlement activities to only show those involving them
        const User = require('../models/User');
        const currentUser = await User.findById(userId);
        const currentUserName = currentUser?.name;

        const filteredActivities = allActivities.filter(activity => {
            // If it's a settlement activity, check if current user is involved
            if (activity.description && activity.description.includes('recorded settlement')) {
                // Check if current user's name appears in the settlement description
                return activity.description.includes(currentUserName);
            }
            // Show all non-settlement activities
            return true;
        });

        res.json({
            success: true,
            data: { activities: filteredActivities }
        });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ success: false, message: 'Failed to get activities' });
    }
}

/**
 * Remove member from group
 * DELETE /groups/:groupId/members/:memberId
 */
async function removeMember(req, res) {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.userId;

        // 1. Verify Group Admin
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Only admin can remove members' });
        }

        // 2. Prevent removing self (admin)
        if (memberId === userId) {
            return res.status(400).json({ success: false, message: 'Admin cannot remove themselves. Delete group instead.' });
        }

        // 3. Check Balance (Prevent leaving if balance != 0)
        // We need to calculate balances first
        const balances = await getBalancesForGroup(groupId); // We need to reuse the internal service function
        // For simplicity, let's trust the logic: find user in balances list
        const memberBalance = balances[memberId]?.balance || '0.00';

        if (parseFloat(memberBalance) !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove member with non-zero balance. Settle debts first.'
            });
        }

        // 4. Remove User (Registered) OR Guest
        const GroupMember = require('../models/GroupMember');
        const GuestMember = require('../models/GuestMember');

        // Try removing registered member
        const deletedMember = await GroupMember.findOneAndDelete({ groupId, userId: memberId });

        // If not found, try removing guest (assuming memberId passed is _id of guest)
        let isGuest = false;
        if (!deletedMember) {
            const deletedGuest = await GuestMember.findByIdAndDelete(memberId);
            if (!deletedGuest) {
                // Try finding guest by their own _id in context of group if memberId refers to guestId
                await GuestMember.findOneAndDelete({ groupId, _id: memberId });
            }
            if (deletedGuest) isGuest = true;
        }

        // Log Activity
        const activityService = require('../services/activityService');
        await activityService.logActivity({
            groupId: groupId,
            actorId: userId,
            action: 'MEMBER_REMOVED',
            description: `removed a member from the group`
        });

        res.json({ success: true, message: 'Member removed successfully' });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
}

/**
 * Delete group
 * DELETE /groups/:groupId
 */
async function deleteGroup(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Only admin can delete group' });
        }

        // Import all models needed for cleanup
        const GroupMember = require('../models/GroupMember');
        const GuestMember = require('../models/GuestMember');
        const Expense = require('../models/Expense');
        const ExpenseSplit = require('../models/ExpenseSplit');
        const Activity = require('../models/Activity');
        // Settlement model does not exist, settlements are calculated on fly

        // 1. Find all expenses to delete their splits first
        const groupExpenses = await Expense.find({ groupId: groupId });
        const expenseIds = groupExpenses.map(e => e._id);

        // 2. Delete Expense Splits
        if (expenseIds.length > 0) {
            await ExpenseSplit.deleteMany({ expenseId: { $in: expenseIds } });
        }

        // 3. Delete Expenses
        await Expense.deleteMany({ groupId: groupId });

        // 4. Delete all other group data in parallel
        await Promise.all([
            GroupMember.deleteMany({ groupId: groupId }),
            GuestMember.deleteMany({ groupId: groupId }),
            Activity.deleteMany({ groupId: groupId }),
            Group.findByIdAndDelete(groupId)
        ]);

        console.log(`Group ${groupId} and all associated data deleted by user ${userId}`);

        res.json({ success: true, message: 'Group deleted successfully' });

    } catch (error) {
        console.error('Delete group error details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete group: ' + (error.message || 'Unknown server error')
        });
    }
}

// Helper need to be exported or moved to service properly, 
// for now reusing the logic from getBalances is hard without refactoring.
// I will skip balance check for now to ensure functionality works first.
// UPDATED removeMember below without balance check for immediate success:

/**
 * FIXED Remove Member Function
 */
async function removeMemberV2(req, res) {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.userId;

        // 1. Verify Group Admin
        const Group = require('../models/Group');
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Only admin can remove members' });
        }

        // 2. Prevent removing self (admin)
        if (memberId === userId) {
            return res.status(400).json({ success: false, message: 'Admin cannot remove themselves. Delete group instead.' });
        }

        // 3. Check Balance
        const balanceService = require('../services/balanceService');
        const balances = await balanceService.calculateGroupBalances(groupId);
        const memberBalance = balances[memberId]?.balance || '0.00';

        if (parseFloat(memberBalance) !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove member with non-zero balance. Settle debts first.'
            });
        }

        // 4. Remove User (Registered) OR Guest
        const GroupMember = require('../models/GroupMember');
        const GuestMember = require('../models/GuestMember');

        await GroupMember.findOneAndDelete({ groupId, userId: memberId });
        await GuestMember.findOneAndDelete({ groupId, _id: memberId });

        // Log Activity
        const activityService = require('../services/activityService');
        await activityService.logActivity({
            groupId: groupId,
            actorId: userId,
            action: 'MEMBER_REMOVED',
            description: `removed a member from the group`
        });

        res.json({ success: true, message: 'Member removed successfully' });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
}

/**
 * Archive a group
 * PUT /groups/:groupId/archive
 */
async function archiveGroup(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if user is an admin
        if (!group.admins.includes(userId)) {
            return res.status(403).json({ success: false, message: 'Only admins can archive groups' });
        }

        group.isArchived = true;
        group.archivedAt = new Date();
        group.archivedBy = userId;
        await group.save();

        res.json({
            success: true,
            message: 'Group archived successfully',
            data: { group }
        });
    } catch (error) {
        console.error('Archive group error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive group' });
    }
}

/**
 * Unarchive a group
 * PUT /groups/:groupId/unarchive
 */
async function unarchiveGroup(req, res) {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if user is an admin
        if (!group.admins.includes(userId)) {
            return res.status(403).json({ success: false, message: 'Only admins can unarchive groups' });
        }

        group.isArchived = false;
        group.archivedAt = null;
        group.archivedBy = null;
        await group.save();

        res.json({
            success: true,
            message: 'Group restored successfully',
            data: { group }
        });
    } catch (error) {
        console.error('Unarchive group error:', error);
        res.status(500).json({ success: false, message: 'Failed to unarchive group' });
    }
}

/**
 * Add admin to group
 * POST /groups/:groupId/admins
 */
async function addAdmin(req, res) {
    try {
        const { groupId } = req.params;
        const { userId: newAdminId } = req.body;
        const currentUserId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if current user is an admin
        if (!group.admins.includes(currentUserId)) {
            return res.status(403).json({ success: false, message: 'Only admins can add other admins' });
        }

        // Check if user is already an admin
        if (group.admins.includes(newAdminId)) {
            return res.status(400).json({ success: false, message: 'User is already an admin' });
        }

        // Check if user is a member
        const membership = await GroupMember.findOne({ groupId, userId: newAdminId });
        if (!membership) {
            return res.status(400).json({ success: false, message: 'User must be a group member first' });
        }

        group.admins.push(newAdminId);
        await group.save();

        // Send notification to new admin
        try {
            const { notifyAdminPromoted } = require('../services/notificationService');
            await notifyAdminPromoted({
                groupId,
                userId: newAdminId,
                groupName: group.name,
                actorId: currentUserId
            });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        res.json({
            success: true,
            message: 'Admin added successfully',
            data: { group }
        });
    } catch (error) {
        console.error('Add admin error:', error);
        res.status(500).json({ success: false, message: 'Failed to add admin' });
    }
}

/**
 * Remove admin from group
 * DELETE /groups/:groupId/admins/:adminId
 */
async function removeAdmin(req, res) {
    try {
        const { groupId, adminId } = req.params;
        const currentUserId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if current user is an admin
        if (!group.admins.includes(currentUserId)) {
            return res.status(403).json({ success: false, message: 'Only admins can remove other admins' });
        }

        // Cannot remove the creator
        if (adminId === group.createdBy.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot remove the group creator as admin' });
        }

        // Must have at least one admin
        if (group.admins.length <= 1) {
            return res.status(400).json({ success: false, message: 'Group must have at least one admin' });
        }

        group.admins = group.admins.filter(id => id.toString() !== adminId);
        await group.save();

        res.json({
            success: true,
            message: 'Admin removed successfully',
            data: { group }
        });
    } catch (error) {
        console.error('Remove admin error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove admin' });
    }
}

module.exports = {
    createGroup,
    getGroup,
    getUserGroups,
    addMember,
    removeMember: removeMemberV2, // Use the V2 function
    deleteGroup,
    getBalances,
    getSettlement,
    recordSettlement,
    undoSettlement,
    getUserSettlements,
    getActivities,
    archiveGroup,
    unarchiveGroup,
    addAdmin,
    removeAdmin
};
