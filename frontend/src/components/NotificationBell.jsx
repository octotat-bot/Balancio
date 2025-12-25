import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/NotificationBell.css';

/**
 * NOTIFICATION BELL COMPONENT
 * Shows unread count and notification panel
 */

export default function NotificationBell({ api }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications?limit=20');
            if (response && response.success && response.data) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            // Don't crash - just keep existing state
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            await loadNotifications();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);
            await api.put('/notifications/read-all');
            await loadNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (notificationId, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${notificationId}`);
            await loadNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        setShowPanel(false);

        // Navigate based on notification type
        if (notification.groupId) {
            const groupId = typeof notification.groupId === 'string'
                ? notification.groupId
                : notification.groupId._id;
            navigate(`/groups/${groupId}`);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'PAYMENT_REMINDER': return '💰';
            case 'EXPENSE_ADDED': return '➕';
            case 'SETTLEMENT_RECORDED': return '✅';
            case 'MEMBER_ADDED': return '👥';
            case 'ADMIN_PROMOTED': return '👑';
            case 'GROUP_ARCHIVED': return '📦';
            default: return '🔔';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diff = now - notifDate;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return notifDate.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-button"
                onClick={() => setShowPanel(!showPanel)}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            <AnimatePresence>
                {showPanel && (
                    <>
                        <div className="notification-overlay" onClick={() => setShowPanel(false)} />
                        <motion.div
                            className="notification-panel"
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="notification-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={loading}
                                        className="mark-all-read-btn"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="empty-notifications">
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔕</div>
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <motion.div
                                            key={notif._id}
                                            className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
                                        >
                                            <div className="notification-icon">
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-title">{notif.title}</div>
                                                <div className="notification-message">{notif.message}</div>
                                                <div className="notification-time">{formatTime(notif.createdAt)}</div>
                                            </div>
                                            <button
                                                className="notification-delete"
                                                onClick={(e) => deleteNotification(notif._id, e)}
                                                title="Delete"
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
