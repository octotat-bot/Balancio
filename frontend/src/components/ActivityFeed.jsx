import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { groupAPI } from '../services/api';
import '../styles/ActivityFeed.css';

export default function ActivityFeed({ groupId }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, [groupId]);

    const loadActivities = async () => {
        try {
            const res = await groupAPI.getActivities(groupId);
            if (res.success) {
                setActivities(res.data.activities);
            }
        } catch (error) {
            console.error('Failed to load activities', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action) => {
        switch (action) {
            case 'GROUP_CREATED': return '✨';
            case 'MEMBER_ADDED': return '👋';
            case 'EXPENSE_CREATED': return '💸';
            case 'SETTLEMENT_RECORDED': return '🤝';
            default: return '📝';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ' at ' +
            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="activity-loading">Loading activity...</div>;
    if (activities.length === 0) return <div className="activity-empty">No activity yet</div>;

    return (
        <div className="activity-feed">
            {activities.map((activity, idx) => (
                <motion.div
                    key={activity._id}
                    className="activity-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <div className="activity-icon">
                        {getIcon(activity.action)}
                    </div>
                    <div className="activity-content">
                        <div className="activity-text">
                            <span className="activity-actor">{activity.actorId?.name || 'Someone'}</span>
                            {' '}{activity.description}
                        </div>
                        <div className="activity-time">
                            {formatDate(activity.createdAt)}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
