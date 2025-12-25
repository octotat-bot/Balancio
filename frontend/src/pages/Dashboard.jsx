import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { groupAPI, api } from '../services/api';
import CreateGroupModal from '../components/CreateGroupModal';
import NotificationBell from '../components/NotificationBell';
import '../styles/Dashboard.css';

/**
 * DASHBOARD - SAGE & STONE REDESIGN
 * Focused, minimal, and action-oriented.
 */

export default function Dashboard() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadGroups();
    }, [showArchived]); // Reload when showArchived changes

    const loadGroups = async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getAll(showArchived);
            if (response.success) {
                setGroups(response.data.groups);
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (groupData) => {
        try {
            await groupAPI.create(groupData);
            setShowCreateModal(false);
            await loadGroups();
        } catch (error) {
            console.error('Failed to create group:', error);
            throw error;
        }
    };

    // Calculate Dashboard Stats
    const totalSpent = groups.reduce((acc, group) => acc + (parseFloat(group.stats?.totalExpense) || 0), 0);
    const activeGroupsCount = groups.length;
    // Mocking "Last Activity" for now based on creation or simple logic, ideal would be to fetch from API
    const lastActivityText = groups.length > 0 ? "Today" : "No activity";

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="dashboard-page">
            <div className="ambient-background" />

            <div className="dashboard-container">
                {/* A. Top Bar */}
                <header className="top-bar">
                    <div className="brand-logo">Balancio</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <NotificationBell api={api} />
                        <button
                            onClick={() => navigate('/profile')}
                            className="user-avatar-btn"
                            title="Profile"
                        >
                            {user?.name?.charAt(0).toUpperCase()}
                        </button>
                    </div>
                </header>

                {/* B. Hero Insight Card */}
                <motion.div
                    className="hero-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="hero-left">
                        <span className="balance-label">Total Balance</span>
                        <h1 className="hero-balance">₹{totalSpent.toFixed(2)}</h1>
                        <span className="balance-subtext">Across all active groups</span>

                        {/* Abstract Background Curve within Hero */}
                        <div className="hero-visual">
                            <div className="sparkline-curve" />
                        </div>
                    </div>
                    <div className="hero-right">
                        <button
                            className="btn-hero-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            + New Group
                        </button>
                    </div>
                </motion.div>

                {/* C. Secondary Stats Strip */}
                <motion.div
                    className="stats-strip"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <div className="stat-strip-card">
                        <span className="stat-strip-label">Active Groups</span>
                        <span className="stat-strip-value">{activeGroupsCount}</span>
                    </div>
                    <div className="stat-strip-card">
                        <span className="stat-strip-label">Total Expenses</span>
                        <span className="stat-strip-value">₹{totalSpent.toFixed(0)}</span>
                    </div>
                    <div className="stat-strip-card">
                        <span className="stat-strip-label">Last Activity</span>
                        <span className="stat-strip-value">{lastActivityText}</span>
                    </div>
                </motion.div>

                {/* D. Groups Section */}
                <section className="groups-section">
                    <div className="groups-header">
                        <h2 className="section-title">Your Groups</h2>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: showArchived ? '2px solid var(--primary-500)' : '2px solid var(--border-color)',
                                background: showArchived ? 'var(--primary-500)' : 'white',
                                color: showArchived ? 'white' : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {showArchived ? '📦 Showing Archived' : '📋 Show Archived'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="groups-grid">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="group-card skeleton-card" style={{ height: '200px', background: 'var(--neutral-100)' }} />
                            ))}
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="empty-state-container">
                            <div className="empty-icon">{showArchived ? '📦' : '🌱'}</div>
                            <p className="empty-text">
                                {showArchived ? 'No archived groups.' : 'No active groups yet. Create one to start splitting expenses.'}
                            </p>
                            {!showArchived && (
                                <button className="btn-create-first" onClick={() => setShowCreateModal(true)}>
                                    Create First Group
                                </button>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            className="groups-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {groups.map((group) => {
                                const isSettled = (parseFloat(group.stats?.totalExpense) || 0) === 0; // Simple logic for now
                                return (
                                    <motion.div
                                        key={group._id}
                                        className="group-card"
                                        variants={itemVariants}
                                        onClick={() => navigate(`/groups/${group._id}`)}
                                        style={{ opacity: group.isArchived ? 0.7 : 1 }}
                                    >
                                        {group.isArchived && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                padding: '4px 8px',
                                                background: 'var(--neutral-200)',
                                                color: 'var(--text-secondary)',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}>
                                                📦 ARCHIVED
                                            </div>
                                        )}
                                        <div className="group-card-header">
                                            <div className="group-info">
                                                <h3>{group.name}</h3>
                                                <span className="member-count">{group.stats?.memberCount || 0} members</span>
                                            </div>
                                            <div className={`status-dot ${isSettled ? 'settled' : 'active'}`} title={isSettled ? 'Settled' : 'Active'} />
                                        </div>

                                        <div className="group-card-footer">
                                            <div className="expense-info">
                                                <span className="expense-label">Total Spent</span>
                                                <span className="expense-amount">₹{parseFloat(group.stats?.totalExpense || 0).toFixed(0)}</span>
                                            </div>
                                            <div className="view-action">View Group →</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <CreateGroupModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={handleCreateGroup}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

