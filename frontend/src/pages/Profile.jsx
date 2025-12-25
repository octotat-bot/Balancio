import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { pageVariants } from '../animations/variants';
import '../styles/Profile.css';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await logout();
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <motion.div
            className="profile-page"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <div className="ambient-background"></div>

            <div className="profile-wrapper">
                <h1 className="profile-title" style={{ marginBottom: '2rem' }}>Profile Settings</h1>

                <div className="profile-bento-grid">
                    {/* User Hero Card */}
                    <motion.div
                        className="bento-card hero-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="hero-avatar">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="hero-info">
                            <h1 className="hero-name">{user.name}</h1>
                            <p className="hero-status">Premium Member</p>
                        </div>
                        <div className="hero-glow"></div>
                    </motion.div>

                    {/* Contact Info Card */}
                    <motion.div
                        className="bento-card info-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="section-header">
                            <h3>Contact Information</h3>
                        </div>
                        <div className="info-row">
                            <div className="info-icon">📧</div>
                            <div className="info-detail">
                                <label>Email Address</label>
                                <div className="value">{user.email}</div>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-icon">📱</div>
                            <div className="info-detail">
                                <label>Phone Number</label>
                                <div className="value">{user.phone}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats & Membership Card */}
                    <motion.div
                        className="bento-card stats-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="stat-item">
                            <label>Joined</label>
                            <div className="stat-value">
                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <label>User ID</label>
                            <div className="stat-value mono">
                                {user._id.slice(-6).toUpperCase()}
                            </div>
                        </div>
                    </motion.div>

                    {/* Logout Action */}
                    <motion.div
                        className="logout-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button
                            onClick={handleLogout}
                            className="premium-logout-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing out...' : 'Sign Out'}
                        </button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
