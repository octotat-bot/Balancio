import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { settlementArrowVariants, celebrationVariants, itemVariants } from '../animations/variants';
import '../styles/SettlementView.css';

/**
 * SETTLEMENT VIEW COMPONENT
 * 
 * Visualizes the settlement plan with toggle between:
 * - Individual debts (all expenses shown separately)
 * - Optimized settlements (consolidated balances)
 */

export default function SettlementView({ settlements, balances, onRecordPayment, currentUserId, onOptimizeToggle, optimized }) {
    const isAllSettled = !settlements || settlements.length === 0;

    if (isAllSettled) {
        return (
            <motion.div
                className="settlement-complete"
                variants={celebrationVariants}
                initial="initial"
                animate="animate"
            >
                <div className="celebration-icon">🎉</div>
                <h2>All Settled!</h2>
                <p>Everyone in this group is square. No payments needed.</p>
            </motion.div>
        );
    }

    return (
        <div className="settlement-view-container">
            <div className="settlement-header">
                <div>
                    <h2 className="section-title">Settlement Plan</h2>
                    <p className="section-description">
                        {optimized
                            ? `Optimized to minimize transactions · ${settlements.length} payment${settlements.length !== 1 ? 's' : ''} needed`
                            : `Showing all individual debts · ${settlements.length} payment${settlements.length !== 1 ? 's' : ''} needed`
                        }
                    </p>
                </div>
                <button
                    onClick={onOptimizeToggle}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: optimized ? '2px solid var(--primary-500)' : '2px solid var(--border-color)',
                        background: optimized ? 'var(--primary-500)' : 'white',
                        color: optimized ? 'white' : 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    {optimized ? '✓ Optimized' : '⚡ Optimize'}
                </button>
            </div>

            <div className="settlements-list">
                {settlements.map((settlement, index) => {
                    // Determine if current user is the debtor or creditor
                    const isDebtor = settlement.from.userId?.toString() === currentUserId?.toString();
                    const isCreditor = settlement.to.userId?.toString() === currentUserId?.toString();

                    return (
                        <motion.div
                            key={index}
                            className="settlement-item"
                            variants={itemVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* From User */}
                            <div className="settlement-user from-user">
                                <div className="user-avatar debtor">
                                    {settlement.from.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info">
                                    <div className="user-name">{settlement.from.userName}</div>
                                    <div className="user-role">Pays</div>
                                </div>
                            </div>

                            {/* Arrow with Amount */}
                            <div className="settlement-arrow-container">
                                <svg
                                    className="settlement-arrow"
                                    width="100%"
                                    height="60"
                                    viewBox="0 0 200 60"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <marker
                                            id={`arrowhead-${index}`}
                                            markerWidth="10"
                                            markerHeight="10"
                                            refX="9"
                                            refY="3"
                                            orient="auto"
                                        >
                                            <polygon
                                                points="0 0, 10 3, 0 6"
                                                fill="var(--primary-500)"
                                            />
                                        </marker>
                                    </defs>
                                    <motion.path
                                        d="M 10 30 L 190 30"
                                        stroke="var(--primary-500)"
                                        strokeWidth="3"
                                        fill="none"
                                        markerEnd={`url(#arrowhead-${index})`}
                                        variants={settlementArrowVariants}
                                        initial="initial"
                                        animate="animate"
                                    />
                                </svg>
                                <div className="settlement-amount">
                                    ₹{parseFloat(settlement.amount).toFixed(2)}
                                </div>
                            </div>

                            {/* To User */}
                            <div className="settlement-user to-user">
                                <div className="user-avatar creditor">
                                    {settlement.to.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info">
                                    <div className="user-name">{settlement.to.userName}</div>
                                    <div className="user-role">Receives</div>
                                </div>
                            </div>

                            {/* Context-Aware Action Button */}
                            {onRecordPayment && (isDebtor || isCreditor) && (
                                <button
                                    className={`btn-mark-paid ${isDebtor ? 'btn-pay' : 'btn-receive'}`}
                                    onClick={() => onRecordPayment(settlement)}
                                    title={isDebtor ? 'Record that you paid this amount' : 'Confirm that you received this payment'}
                                >
                                    {isDebtor ? '💸 Pay Now' : '✓ Mark as Received'}
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary */}
            <motion.div
                className="settlement-summary"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="summary-card">
                    <div className="summary-icon">💡</div>
                    <div className="summary-content">
                        <h3>Why this plan?</h3>
                        <p>
                            This settlement plan minimizes the number of transactions needed.
                            Instead of everyone paying everyone, we've optimized it to just{' '}
                            {settlements.length} payment{settlements.length !== 1 ? 's' : ''}.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
