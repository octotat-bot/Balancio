import React from 'react';
import { motion } from 'framer-motion';
import { balanceAvatarVariants, breathingVariants, itemVariants } from '../animations/variants';
import '../styles/BalanceAvatars.css';

/**
 * BALANCE AVATARS COMPONENT
 * 
 * Animated user avatars showing balance status
 * - Creditors (owed money): Glow softly in green
 * - Debtors (owe money): Pulse gently in orange
 * - Neutral (settled): Calm, no animation
 */

export default function BalanceAvatars({ balances }) {
    if (!balances || balances.length === 0) {
        return (
            <div className="empty-state">
                <p>No balance data available</p>
            </div>
        );
    }

    const getBalanceType = (balance) => {
        const amount = parseFloat(balance);
        if (amount > 0.01) return 'creditor';
        if (amount < -0.01) return 'debtor';
        return 'neutral';
    };

    const getBalanceClass = (balance) => {
        const amount = parseFloat(balance);
        if (amount > 0.01) return 'positive';
        if (amount < -0.01) return 'negative';
        return 'neutral';
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="balance-avatars-container">
            <h2 className="section-title">Group Balances</h2>
            <p className="section-description">
                Green glow = should receive money · Orange pulse = owes money · Calm = settled
            </p>

            <div className="avatars-grid">
                {balances.map((member, index) => {
                    const balanceType = getBalanceType(member.balance);
                    const balanceClass = getBalanceClass(member.balance);
                    const amount = Math.abs(parseFloat(member.balance));

                    return (
                        <motion.div
                            key={member.userId || member.guestId}
                            className="balance-avatar-card"
                            variants={itemVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div
                                className={`balance-avatar ${balanceClass}`}
                                variants={balanceAvatarVariants}
                                animate={balanceType}
                            >
                                {getInitials(member.userName)}
                            </motion.div>

                            <div className="balance-info">
                                <h3 className="member-name">{member.userName}</h3>
                                <div className={`balance-amount ${balanceClass}`}>
                                    {balanceType === 'creditor' && '+'}
                                    {balanceType === 'debtor' && '-'}
                                    ₹{amount.toFixed(2)}
                                </div>
                                <div className="balance-status">
                                    {balanceType === 'creditor' && (
                                        <span className="badge badge-success">Should receive</span>
                                    )}
                                    {balanceType === 'debtor' && (
                                        <span className="badge badge-warning">Owes</span>
                                    )}
                                    {balanceType === 'neutral' && (
                                        <span className="badge badge-neutral">Settled</span>
                                    )}
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="balance-breakdown">
                                <div className="breakdown-item">
                                    <span className="breakdown-label">Paid</span>
                                    <span className="breakdown-value">
                                        ₹{parseFloat(member.totalPaid || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="breakdown-item">
                                    <span className="breakdown-label">Share</span>
                                    <span className="breakdown-value">
                                        ₹{parseFloat(member.totalOwed || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
