import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/SettlementHistory.css';

/**
 * SETTLEMENT HISTORY COMPONENT
 * Shows timeline of all cleared settlements with undo option
 */

export default function SettlementHistory({ groupId, currentUserId, onRefresh, groupAPI }) {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [undoing, setUndoing] = useState(null);

    useEffect(() => {
        loadSettlements();
    }, [groupId]);

    const loadSettlements = async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getUserSettlements(groupId);
            if (response.success) {
                // Filter only cleared settlements and sort by date
                const cleared = response.data.settlements
                    .filter(s => s.status === 'CLEARED')
                    .sort((a, b) => new Date(b.clearedAt) - new Date(a.clearedAt));
                setSettlements(cleared);
            }
        } catch (error) {
            console.error('Failed to load settlements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async (settlement) => {
        if (!window.confirm(`Undo this settlement of ₹${parseFloat(settlement.amount).toFixed(2)}?`)) {
            return;
        }

        try {
            setUndoing(settlement._id);
            await groupAPI.undoSettlement(groupId, settlement._id);
            await loadSettlements();
            if (onRefresh) onRefresh();
        } catch (error) {
            alert(error.message || 'Failed to undo settlement');
        } finally {
            setUndoing(null);
        }
    };

    const canUndo = (settlement) => {
        // Can undo if within 24 hours and user is involved
        const hoursSince = (Date.now() - new Date(settlement.clearedAt)) / (1000 * 60 * 60);
        const isInvolved = settlement.fromUser._id === currentUserId || settlement.toUser._id === currentUserId;
        return hoursSince < 24 && isInvolved;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Yesterday at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    if (loading) {
        return (
            <div className="settlement-history-loading">
                <div className="spinner"></div>
                <p>Loading settlement history...</p>
            </div>
        );
    }

    if (settlements.length === 0) {
        return (
            <div className="settlement-history-empty">
                <div className="empty-icon">💸</div>
                <h3>No Settlement History</h3>
                <p>Cleared settlements will appear here</p>
            </div>
        );
    }

    return (
        <div className="settlement-history">
            <div className="settlement-history-header">
                <h3>Settlement History</h3>
                <p className="settlement-count">{settlements.length} settlement{settlements.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="settlement-timeline">
                {settlements.map((settlement, index) => {
                    const isCurrentUserPayer = settlement.fromUser._id === currentUserId;
                    const isCurrentUserReceiver = settlement.toUser._id === currentUserId;
                    const showUndo = canUndo(settlement);

                    return (
                        <motion.div
                            key={settlement._id}
                            className="settlement-timeline-item"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="timeline-marker">
                                <div className="timeline-dot"></div>
                                {index < settlements.length - 1 && <div className="timeline-line"></div>}
                            </div>

                            <div className="settlement-card">
                                <div className="settlement-card-header">
                                    <div className="settlement-icon">
                                        {isCurrentUserPayer ? '💸' : '💰'}
                                    </div>
                                    <div className="settlement-info">
                                        <div className="settlement-title">
                                            <span className="user-name">{settlement.fromUser.name}</span>
                                            <span className="arrow">→</span>
                                            <span className="user-name">{settlement.toUser.name}</span>
                                        </div>
                                        <div className="settlement-amount">
                                            ₹{parseFloat(settlement.amount).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="settlement-card-footer">
                                    <div className="settlement-date">
                                        {formatDate(settlement.clearedAt)}
                                    </div>
                                    {showUndo && (
                                        <button
                                            className="undo-button"
                                            onClick={() => handleUndo(settlement)}
                                            disabled={undoing === settlement._id}
                                        >
                                            {undoing === settlement._id ? '⏳ Undoing...' : '↩️ Undo'}
                                        </button>
                                    )}
                                </div>

                                {isCurrentUserPayer && (
                                    <div className="settlement-badge payer-badge">You paid</div>
                                )}
                                {isCurrentUserReceiver && (
                                    <div className="settlement-badge receiver-badge">You received</div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
