import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { groupAPI, expenseAPI } from '../services/api';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import BalanceAvatars from '../components/BalanceAvatars';
import ExpenseTimeline from '../components/ExpenseTimeline';
import SettlementView from '../components/SettlementView';
import AddExpenseModal from '../components/AddExpenseModal';
import EditExpenseModal from '../components/EditExpenseModal';
import AddMemberModal from '../components/AddMemberModal';
import ConfirmModal from '../components/ConfirmModal';
import PaymentModal from '../components/PaymentModal';
import SettlementHistory from '../components/SettlementHistory';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';
import '../styles/GroupDetail.css';

/**
 * GROUP DETAIL PAGE
 * Enhanced with sidebar and detailed member info
 */

export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [group, setGroup] = useState(null);
    const [balances, setBalances] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [settlement, setSettlement] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('balances');
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showEditExpense, setShowEditExpense] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showAddMember, setShowAddMember] = useState(false);
    const [paymentModal, setPaymentModal] = useState({
        isOpen: false,
        settlement: null
    });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false,
        isAlert: false
    });

    const openConfirm = ({ title, message, onConfirm, isDanger = false, isAlert = false }) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, isDanger, isAlert });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    const [expenseFilters, setExpenseFilters] = useState({
        category: 'All',
        search: '',
        sortBy: 'newest'
    });
    const [optimizeSettlement, setOptimizeSettlement] = useState(false);

    const loadGroupData = async (filters = expenseFilters) => {
        try {
            setLoading(true);

            // Build query params for expense filtering
            const expenseParams = new URLSearchParams();
            if (filters.category && filters.category !== 'All') {
                expenseParams.append('category', filters.category);
            }
            if (filters.search) {
                expenseParams.append('search', filters.search);
            }
            if (filters.sortBy) {
                expenseParams.append('sortBy', filters.sortBy);
            }

            const [groupRes, balancesRes, expensesRes, settlementRes] = await Promise.all([
                groupAPI.getById(groupId),
                groupAPI.getBalances(groupId),
                expenseAPI.getByGroup(groupId, filters.category !== 'All' ? filters : { search: filters.search, sortBy: filters.sortBy }),
                groupAPI.getSettlement(groupId, optimizeSettlement) // Pass optimize flag
            ]);

            if (groupRes.success) setGroup(groupRes.data.group);
            if (balancesRes.success) setBalances(balancesRes.data.balances);
            if (expensesRes.success) setExpenses(expensesRes.data.expenses);
            if (settlementRes.success) setSettlement(settlementRes.data.settlements);
        } catch (error) {
            console.error('Failed to load group data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExpenseFilterChange = (filters) => {
        setExpenseFilters(filters);
        loadGroupData(filters);
    };

    const handleOptimizeToggle = async () => {
        const newOptimize = !optimizeSettlement;
        setOptimizeSettlement(newOptimize);

        // Reload settlement with new optimize setting
        try {
            const settlementRes = await groupAPI.getSettlement(groupId, newOptimize);
            if (settlementRes.success) {
                setSettlement(settlementRes.data.settlements);
            }
        } catch (error) {
            console.error('Failed to toggle optimization:', error);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!group) return <div className="error-page"><h2>Group not found</h2></div>;

    const totalSpent = group.stats?.totalExpense || '0.00';
    const isSettled = settlement.length === 0;

    // Helper to get initials
    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper: Get last activity date
    const getLastActivity = () => {
        if (!expenses || expenses.length === 0) return 'No activity';
        const last = expenses[0]; // Assuming sorted desc
        const date = new Date(last.date);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            className="group-detail-page"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <div className="ambient-background"></div>

            <div className="main-container">
                {/* 1. TOP NAVIGATION / BACK */}
                <button onClick={() => navigate('/dashboard')} className="back-btn" title="Back to Dashboard">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="url(#gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="gradient" x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                </button>

                {/* 2. GROUP HEADER CARD (Top Priority) */}
                <div className="group-header-card">
                    <div className="gh-left">
                        <span className="group-tag">{group.category || 'Trip'}</span>
                        <h1 className="group-title-h1">{group.name}</h1>
                        <span className="created-date">Created {formatDate(group.createdAt)}</span>
                    </div>
                    <div className="gh-right">
                        <div className="gh-stat">
                            <label>Total Spent</label>
                            <span className="amount">₹{parseFloat(totalSpent).toFixed(2)}</span>
                        </div>
                        <div className={`status-chip ${isSettled ? 'settled' : 'pending'}`}>
                            {isSettled ? 'Settled' : 'Pending'}
                        </div>

                        {/* User Avatar Button */}
                        <button
                            onClick={() => navigate('/profile')}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--primary-500)',
                                color: 'white',
                                border: '2px solid white',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'transform 0.2s',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            title={`Logged in as ${user?.name || 'User'}`}
                        >
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </button>

                        <button
                            className="btn-primary-lg"
                            onClick={() => setShowAddExpense(true)}
                        >
                            + Add Expense
                        </button>
                    </div>
                </div>

                {/* 3. INSIGHT STRIP */}
                <div className="insight-strip">
                    <div className="metric-card">
                        <label>Total Expenses</label>
                        <div className="metric-value">₹{parseFloat(totalSpent).toFixed(2)}</div>
                    </div>
                    <div className="metric-card">
                        <label>Members</label>
                        <div className="metric-value">{group.members?.length || 0}</div>
                    </div>
                    <div className="metric-card">
                        <label>Last Activity</label>
                        <div className="metric-value">{getLastActivity()}</div>
                    </div>
                </div>

                {/* 4. CONTENT AREA (Layout Grid) */}
                <div className="content-area">
                    {/* MAIN COLUMN (Tabs & Content) */}
                    <div className="main-column">
                        <div className="tabs">
                            <button className={`tab ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>Balances</button>
                            <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</button>
                            <button className={`tab ${activeTab === 'settlement' ? 'active' : ''}`} onClick={() => setActiveTab('settlement')}>Settlement</button>
                            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
                            <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</button>
                        </div>

                        <div className="tab-content-wrapper">
                            <AnimatePresence mode="wait">
                                {activeTab === 'balances' && (
                                    <motion.div key="balances" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                                        <BalanceAvatars balances={balances} />
                                    </motion.div>
                                )}
                                {activeTab === 'expenses' && (
                                    <motion.div key="expenses" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                                        <ExpenseTimeline
                                            expenses={expenses}
                                            onRefresh={loadGroupData}
                                            isAdmin={group.createdBy._id === user?._id}
                                            currentUserId={user?._id}
                                            onFilterChange={handleExpenseFilterChange}
                                            onEdit={(expense) => {
                                                setEditingExpense(expense);
                                                setShowEditExpense(true);
                                            }}
                                            onDelete={(expense) => {
                                                openConfirm({
                                                    title: 'Delete Expense?',
                                                    message: `Are you sure you want to delete "${expense.description}" (₹${parseFloat(expense.amount).toFixed(2)})? This will recalculate all balances.`,
                                                    isDanger: true,
                                                    onConfirm: async () => {
                                                        try {
                                                            await expenseAPI.delete(expense._id);
                                                            closeConfirm();
                                                            loadGroupData();

                                                            // Show success message
                                                            setTimeout(() => {
                                                                openConfirm({
                                                                    title: 'Expense Deleted',
                                                                    message: 'The expense has been deleted successfully.',
                                                                    isAlert: true,
                                                                    onConfirm: closeConfirm
                                                                });
                                                            }, 300);
                                                        } catch (err) {
                                                            console.error('Failed to delete expense:', err);
                                                            closeConfirm();
                                                            setTimeout(() => {
                                                                openConfirm({
                                                                    title: 'Error Deleting Expense',
                                                                    message: err.message || 'Failed to delete the expense. Please try again.',
                                                                    isAlert: true,
                                                                    onConfirm: closeConfirm
                                                                });
                                                            }, 200);
                                                        }
                                                    }
                                                });
                                            }}
                                        />
                                    </motion.div>
                                )}
                                {activeTab === 'settlement' && (
                                    <motion.div key="settlement" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                                        <SettlementView
                                            settlements={settlement.filter(s => {
                                                const currentUserId = user?._id?.toString();
                                                const fromUserId = s.from.userId?.toString();
                                                const toUserId = s.to.userId?.toString();
                                                return fromUserId === currentUserId || toUserId === currentUserId;
                                            })}
                                            balances={balances}
                                            currentUserId={user?._id}
                                            optimized={optimizeSettlement}
                                            onOptimizeToggle={handleOptimizeToggle}
                                            onRecordPayment={(settlementItem) => {
                                                const isDebtor = settlementItem.from.userId?.toString() === user?._id?.toString();

                                                if (isDebtor) {
                                                    // Open PaymentModal for debtors (allows partial payment)
                                                    setPaymentModal({
                                                        isOpen: true,
                                                        settlement: settlementItem
                                                    });
                                                } else {
                                                    // For creditors, use simple confirm (full amount only)
                                                    openConfirm({
                                                        title: 'Confirm Receipt',
                                                        message: `Confirm that you have received ₹${parseFloat(settlementItem.amount).toFixed(2)} from ${settlementItem.from.userName}. This will clear their debt to you.`,
                                                        isDanger: false,
                                                        onConfirm: async () => {
                                                            try {
                                                                // Create a CLEARED Settlement record
                                                                await groupAPI.recordSettlement(groupId, {
                                                                    fromUser: settlementItem.from.userId,
                                                                    toUser: settlementItem.to.userId,
                                                                    amount: settlementItem.amount
                                                                });
                                                                closeConfirm();

                                                                // Refresh data to show updated balances
                                                                await loadGroupData();

                                                                // Show success message
                                                                setTimeout(() => {
                                                                    openConfirm({
                                                                        title: 'Settlement Cleared! ✓',
                                                                        message: `The ₹${parseFloat(settlementItem.amount).toFixed(2)} payment has been recorded. Balances have been updated.`,
                                                                        isAlert: true,
                                                                        onConfirm: closeConfirm
                                                                    });
                                                                }, 300);
                                                            } catch (err) {
                                                                console.error('Failed to record settlement:', err);
                                                                closeConfirm();
                                                                setTimeout(() => {
                                                                    openConfirm({
                                                                        title: 'Error Recording Settlement',
                                                                        message: err.message || 'Failed to record the settlement. Please try again.',
                                                                        isAlert: true,
                                                                        onConfirm: closeConfirm
                                                                    });
                                                                }, 200);
                                                            }
                                                        }
                                                    });
                                                }
                                            }}
                                        />
                                    </motion.div>
                                )}
                                {activeTab === 'history' && (
                                    <motion.div key="history" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                                        <SettlementHistory
                                            groupId={groupId}
                                            currentUserId={user?._id}
                                            onRefresh={loadGroupData}
                                            groupAPI={groupAPI}
                                        />
                                    </motion.div>
                                )}
                                {activeTab === 'activity' && (
                                    <motion.div key="activity" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                                        <ActivityFeed groupId={groupId} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* SIDE COLUMN (Members & Danger Zone) */}
                    <div className="side-column">
                        {/* Members Card */}
                        <div className="sidebar-card members-card">
                            <div className="card-header-row">
                                <h3>Members</h3>
                                {group.createdBy._id === user?._id && (
                                    <button onClick={() => setShowAddMember(true)} className="btn-icon-text">
                                        + Add
                                    </button>
                                )}
                            </div>
                            <div className="members-list-pro">
                                {group.members?.map((member, idx) => (
                                    <div key={member._id || idx} className="member-row-pro">
                                        <div className="mem-avatar">
                                            {getInitials(member.userName)}
                                        </div>
                                        <div className="mem-info">
                                            <span className="mem-name">{member.userName}</span>
                                            <span className="mem-role">
                                                {group.createdBy._id === member.userId ? 'Admin' : member.isGuest ? 'Guest' : 'Member'}
                                            </span>
                                        </div>
                                        {group.createdBy._id === user?._id && member.userId !== user._id && (
                                            <button className="mem-remove-btn" onClick={() => {
                                                // Check if this member has any outstanding balance
                                                const memberBalance = balances.find(b =>
                                                    b.userId === member.userId || b.userId === member._id
                                                );
                                                const hasBalance = memberBalance && parseFloat(memberBalance.balance) !== 0;
                                                const balanceAmount = hasBalance ? parseFloat(memberBalance.balance).toFixed(2) : '0.00';

                                                let warningMessage = 'They will be removed from the group.';
                                                if (hasBalance) {
                                                    if (parseFloat(balanceAmount) > 0) {
                                                        warningMessage = `⚠️ ${member.userName} is owed ₹${balanceAmount}. Removing them will clear this balance. Are you sure you want to continue?`;
                                                    } else {
                                                        warningMessage = `⚠️ ${member.userName} owes ₹${Math.abs(parseFloat(balanceAmount)).toFixed(2)}. Removing them will clear this debt. Are you sure you want to continue?`;
                                                    }
                                                }

                                                openConfirm({
                                                    title: `Remove ${member.userName}?`,
                                                    message: warningMessage,
                                                    isDanger: true,
                                                    onConfirm: async () => {
                                                        try {
                                                            await groupAPI.removeMember(groupId, member.userId || member._id);
                                                            closeConfirm();
                                                            loadGroupData();
                                                        } catch (e) {
                                                            console.error(e);
                                                            closeConfirm();
                                                            // Show error message
                                                            setTimeout(() => {
                                                                openConfirm({
                                                                    title: 'Cannot Remove Member',
                                                                    message: e.message || 'Failed to remove member. Please try again.',
                                                                    isAlert: true,
                                                                    onConfirm: closeConfirm
                                                                });
                                                            }, 200);
                                                        }
                                                    }
                                                });
                                            }}>✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Group Info Card */}
                        <div className="sidebar-card info-card">
                            <h3 className="card-title-sm">Group Info</h3>
                            <p className="info-text-sm">
                                ID: <span className="mono-badge">{group.code || groupId.slice(-6)}</span>
                            </p>
                        </div>

                        {/* Payment Reminders */}
                        {group.isAdmin && (
                            <div className="sidebar-card">
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                                    💰 Payment Reminders
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    Send gentle reminders to members with outstanding balances.
                                </p>
                                <button
                                    className="btn btn-secondary"
                                    onClick={async () => {
                                        try {
                                            const { notificationAPI } = await import('../services/api');
                                            const response = await notificationAPI.sendReminders(groupId);
                                            openConfirm({
                                                title: 'Reminders Sent! 📧',
                                                message: response.data?.count > 0
                                                    ? `Sent ${response.data.count} payment reminder(s)`
                                                    : 'No outstanding balances to remind about',
                                                isAlert: true,
                                                onConfirm: closeConfirm
                                            });
                                        } catch (err) {
                                            openConfirm({
                                                title: 'Error',
                                                message: err.message || 'Failed to send reminders.',
                                                isAlert: true,
                                                onConfirm: closeConfirm
                                            });
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    📧 Send Reminders
                                </button>
                            </div>
                        )}


                        {/* Archive Management */}
                        {group.isAdmin && (
                            <div className="sidebar-card">
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                                    {group.isArchived ? '📦 Archived Group' : '📋 Archive Group'}
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    {group.isArchived
                                        ? 'This group is archived. Restore it to make it active again.'
                                        : 'Archive this group to hide it from your active list while keeping all data.'
                                    }
                                </p>
                                <button
                                    className={group.isArchived ? "btn btn-primary" : "btn btn-secondary"}
                                    onClick={async () => {
                                        try {
                                            if (group.isArchived) {
                                                await groupAPI.unarchiveGroup(groupId);
                                                openConfirm({
                                                    title: 'Group Restored! ✓',
                                                    message: 'This group is now active again.',
                                                    isAlert: true,
                                                    onConfirm: closeConfirm
                                                });
                                            } else {
                                                await groupAPI.archiveGroup(groupId);
                                                openConfirm({
                                                    title: 'Group Archived! 📦',
                                                    message: 'This group has been moved to archives.',
                                                    isAlert: true,
                                                    onConfirm: closeConfirm
                                                });
                                            }
                                            // Reload group data
                                            await loadGroupData();
                                        } catch (err) {
                                            openConfirm({
                                                title: 'Error',
                                                message: err.message || 'Failed to update archive status.',
                                                isAlert: true,
                                                onConfirm: closeConfirm
                                            });
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    {group.isArchived ? '♻️ Restore Group' : '📦 Archive Group'}
                                </button>
                            </div>
                        )}

                        {/* Admin Management */}
                        {group.isAdmin && (
                            <div className="sidebar-card">
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                                    👑 Administrators
                                </h3>
                                <div style={{ marginBottom: '12px' }}>
                                    {group.admins?.map(admin => {
                                        // Find the member info for this admin
                                        const memberInfo = group.members?.find(m =>
                                            (m.userId === admin._id) || (m.userId?._id === admin._id)
                                        );

                                        return (
                                            <div key={admin._id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '6px',
                                                marginBottom: '6px'
                                            }}>
                                                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                                    {admin.name}
                                                    {admin._id === group.createdBy._id && ' (Creator)'}
                                                </span>
                                                {admin._id !== group.createdBy._id && group.admins?.length > 1 && (
                                                    <button
                                                        onClick={async () => {
                                                            openConfirm({
                                                                title: 'Remove Admin?',
                                                                message: `Remove ${admin.name} as admin?`,
                                                                isDanger: true,
                                                                onConfirm: async () => {
                                                                    try {
                                                                        await groupAPI.removeAdmin(groupId, admin._id);
                                                                        closeConfirm();
                                                                        await loadGroupData();
                                                                        openConfirm({
                                                                            title: 'Admin Removed! ✓',
                                                                            message: `${admin.name} is no longer an admin.`,
                                                                            isAlert: true,
                                                                            onConfirm: closeConfirm
                                                                        });
                                                                    } catch (err) {
                                                                        closeConfirm();
                                                                        openConfirm({
                                                                            title: 'Error',
                                                                            message: err.message,
                                                                            isAlert: true,
                                                                            onConfirm: closeConfirm
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            background: 'transparent',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <select
                                    onChange={async (e) => {
                                        const userId = e.target.value;
                                        if (!userId) return;

                                        try {
                                            await groupAPI.addAdmin(groupId, userId);
                                            e.target.value = '';
                                            openConfirm({
                                                title: 'Admin Added! ✓',
                                                message: 'User has been promoted to admin.',
                                                isAlert: true,
                                                onConfirm: closeConfirm
                                            });
                                            await loadGroupData();
                                        } catch (err) {
                                            openConfirm({
                                                title: 'Error',
                                                message: err.message || 'Failed to add admin.',
                                                isAlert: true,
                                                onConfirm: closeConfirm
                                            });
                                        }
                                    }}
                                    className="input"
                                    defaultValue=""
                                >
                                    <option value="">+ Add Admin...</option>
                                    {group.members?.filter(m => {
                                        // Only show registered users who are not already admins
                                        if (!m.userId || m.isGuest) return false;
                                        const memberId = typeof m.userId === 'string' ? m.userId : m.userId._id;
                                        return !group.admins?.some(a => a._id === memberId);
                                    }).map(member => {
                                        const memberId = typeof member.userId === 'string' ? member.userId : member.userId._id;
                                        const memberName = member.userName || member.userId?.name;
                                        return (
                                            <option key={memberId} value={memberId}>
                                                {memberName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* Danger Zone */}
                        {group.createdBy._id === user?._id && (
                            <div className="sidebar-card danger-zone-card">
                                <h3 className="danger-title">Danger Zone</h3>
                                <p className="danger-desc">This action cannot be undone.</p>
                                <button
                                    className="btn-danger-outline"
                                    onClick={() => openConfirm({
                                        title: 'Delete Group?',
                                        message: 'Are you sure you want to DELETE this group? All data will be lost.',
                                        isDanger: true,
                                        onConfirm: async () => {
                                            try {
                                                console.log("Attempting to delete group:", groupId);
                                                const response = await groupAPI.deleteGroup(groupId);
                                                console.log("Delete response:", response);

                                                // Close modal first
                                                closeConfirm();

                                                // Short delay to ensure state clears
                                                setTimeout(() => {
                                                    navigate('/dashboard', { replace: true });
                                                }, 100);

                                            } catch (err) {
                                                console.error("Delete failed:", err);
                                                closeConfirm();
                                                // Show error in a new alert modal
                                                setTimeout(() => {
                                                    openConfirm({
                                                        title: 'Cannot Delete Group',
                                                        message: err.message || 'Server error. Ensure all expenses are settled first.',
                                                        isAlert: true,
                                                        onConfirm: closeConfirm
                                                    });
                                                }, 200);
                                            }
                                        }
                                    })}
                                >
                                    Delete Group
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showAddExpense && (
                    <AddExpenseModal
                        groupId={groupId}
                        members={group.members}
                        onClose={() => setShowAddExpense(false)}
                        onCreate={async (data) => {
                            await expenseAPI.create(data);
                            setShowAddExpense(false);
                            loadGroupData();
                        }}
                    />
                )}
                {showEditExpense && editingExpense && (
                    <EditExpenseModal
                        expense={editingExpense}
                        members={group.members}
                        onClose={() => {
                            setShowEditExpense(false);
                            setEditingExpense(null);
                        }}
                        onUpdate={async (expenseId, data) => {
                            await expenseAPI.update(expenseId, data);
                            setShowEditExpense(false);
                            setEditingExpense(null);
                            loadGroupData();
                        }}
                    />
                )}
                {showAddMember && (
                    <AddMemberModal
                        onClose={() => setShowAddMember(false)}
                        onAdd={async (data) => {
                            await groupAPI.addMember(groupId, data);
                            setShowAddMember(false);
                            loadGroupData();
                        }}
                    />
                )}
            </AnimatePresence>


            <PaymentModal
                isOpen={paymentModal.isOpen}
                settlement={paymentModal.settlement}
                onClose={() => setPaymentModal({ isOpen: false, settlement: null })}
                onConfirm={async (amount) => {
                    try {
                        const settlement = paymentModal.settlement;
                        // Record the payment (full or partial)
                        await groupAPI.recordSettlement(groupId, {
                            fromUser: settlement.from.userId,
                            toUser: settlement.to.userId,
                            amount: amount.toString()
                        });

                        // Close payment modal
                        setPaymentModal({ isOpen: false, settlement: null });

                        // Refresh data
                        await loadGroupData();

                        // Show success message
                        const isPartial = amount < parseFloat(settlement.amount);
                        setTimeout(() => {
                            openConfirm({
                                title: 'Payment Recorded! ✓',
                                message: isPartial
                                    ? `Partial payment of ₹${amount.toFixed(2)} recorded. Remaining: ₹${(parseFloat(settlement.amount) - amount).toFixed(2)}`
                                    : `Full payment of ₹${amount.toFixed(2)} recorded. Debt cleared!`,
                                isAlert: true,
                                onConfirm: closeConfirm
                            });
                        }, 300);
                    } catch (err) {
                        console.error('Failed to record payment:', err);
                        setPaymentModal({ isOpen: false, settlement: null });
                        setTimeout(() => {
                            openConfirm({
                                title: 'Error Recording Payment',
                                message: err.message || 'Failed to record the payment. Please try again.',
                                isAlert: true,
                                onConfirm: closeConfirm
                            });
                        }, 200);
                    }
                }}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
                isDanger={confirmModal.isDanger}
                isAlert={confirmModal.isAlert}
            />
        </motion.div>
    );
}
