import React from 'react';
import { motion } from 'framer-motion';
import { modalVariants, backdropVariants } from '../animations/variants';
import '../styles/Modal.css';

export default function ExpenseDetailModal({ expense, onClose }) {
    if (!expense) return null;

    const isItemized = expense.splitType === 'ITEMIZED';

    return (
        <>
            <motion.div
                className="modal-backdrop"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="modal-container"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '600px' }}
                >
                    <div className="modal-header">
                        <h2>Expense Details</h2>
                        <button onClick={onClose} className="modal-close">×</button>
                    </div>

                    <div className="modal-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Expense Info */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{expense.description}</h3>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <span className="category-badge" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                                    {expense.category || 'Other'}
                                </span>
                                {isItemized && (
                                    <span className="category-badge" style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>
                                        📋 Itemized
                                    </span>
                                )}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                Paid by <strong>{expense.paidBy.name}</strong>
                            </div>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: 700,
                                color: 'var(--primary-600)',
                                marginTop: '12px'
                            }}>
                                ₹{parseFloat(expense.amount).toFixed(2)}
                            </div>
                        </div>

                        {/* Itemized Breakdown */}
                        {isItemized && expense.items && expense.items.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                                    📋 Items Breakdown
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {expense.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: '12px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    Shared by {item.sharedBy?.length || 0} {item.sharedBy?.length === 1 ? 'person' : 'people'}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                                                ₹{(parseFloat(item.amount) || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Common Charges */}
                                    {expense.commonCharges && parseFloat(expense.commonCharges.amount) > 0 && (
                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--primary-50)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderLeft: '3px solid var(--primary-500)'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                    {expense.commonCharges.description || 'Common Charges'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    Split equally among all
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                                                ₹{(parseFloat(expense.commonCharges.amount) || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Individual Shares */}
                        {expense.splits && expense.splits.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                                    {isItemized ? 'Calculated Shares' : 'Split Among'}
                                </h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '10px'
                                }}>
                                    {expense.splits.map((split) => (
                                        <div key={split.userId || split.guestId} style={{
                                            padding: '12px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 500 }}>{split.userName}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                                                ₹{parseFloat(split.shareAmount).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
