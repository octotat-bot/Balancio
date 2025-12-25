import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Modal.css';

/**
 * PAYMENT MODAL COMPONENT
 * 
 * Allows users to choose between:
 * - Full payment (default)
 * - Partial/Custom payment
 */

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

export default function PaymentModal({ isOpen, onClose, settlement, onConfirm }) {
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'custom'
    const [customAmount, setCustomAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const fullAmount = parseFloat(settlement?.amount || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amountToPay = paymentType === 'full'
            ? fullAmount
            : parseFloat(customAmount);

        // Validation
        if (paymentType === 'custom') {
            if (!customAmount || amountToPay <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            if (amountToPay > fullAmount) {
                alert(`Amount cannot exceed ₹${fullAmount.toFixed(2)}`);
                return;
            }
        }

        setLoading(true);
        try {
            await onConfirm(amountToPay);
            onClose();
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
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
                    style={{ maxWidth: '500px' }}
                >
                    <div className="modal-header">
                        <h2>Record Payment</h2>
                        <button onClick={onClose} className="modal-close">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        {/* Payment Details */}
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Payment from <strong>{settlement?.from?.userName}</strong> to <strong>{settlement?.to?.userName}</strong>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-600)' }}>
                                Total Owed: ₹{fullAmount.toFixed(2)}
                            </div>
                        </div>

                        {/* Payment Type Selection */}
                        <div className="input-group">
                            <label className="input-label">Payment Type</label>

                            {/* Full Payment Option */}
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: `2px solid ${paymentType === 'full' ? 'var(--primary-500)' : 'var(--border-color)'}`,
                                    borderRadius: '8px',
                                    marginBottom: '12px',
                                    cursor: 'pointer',
                                    background: paymentType === 'full' ? 'var(--primary-50)' : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="full"
                                    checked={paymentType === 'full'}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                    style={{ marginRight: '12px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                        💰 Full Payment
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        Pay the complete amount of ₹{fullAmount.toFixed(2)}
                                    </div>
                                </div>
                                {paymentType === 'full' && (
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: 'var(--primary-600)'
                                    }}>
                                        ₹{fullAmount.toFixed(2)}
                                    </div>
                                )}
                            </label>

                            {/* Custom/Partial Payment Option */}
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: `2px solid ${paymentType === 'custom' ? 'var(--primary-500)' : 'var(--border-color)'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: paymentType === 'custom' ? 'var(--primary-50)' : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="custom"
                                    checked={paymentType === 'custom'}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                    style={{ marginRight: '12px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                        ✏️ Partial Payment
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        Pay a custom amount now, rest later
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Custom Amount Input */}
                        {paymentType === 'custom' && (
                            <div className="input-group" style={{ marginTop: '16px' }}>
                                <label htmlFor="customAmount" className="input-label">
                                    Enter Amount
                                </label>
                                <input
                                    type="number"
                                    id="customAmount"
                                    step="0.01"
                                    min="0.01"
                                    max={fullAmount}
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="input"
                                    placeholder={`Max: ₹${fullAmount.toFixed(2)}`}
                                    required
                                    autoFocus
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                                    Remaining after payment: ₹{(fullAmount - (parseFloat(customAmount) || 0)).toFixed(2)}
                                </small>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="modal-actions" style={{ marginTop: '24px' }}>
                            <button type="button" onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner"></span> :
                                    paymentType === 'full'
                                        ? `Pay ₹${fullAmount.toFixed(2)}`
                                        : `Pay ₹${(parseFloat(customAmount) || 0).toFixed(2)}`
                                }
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
