import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { modalVariants, backdropVariants, expenseInputVariants } from '../animations/variants';
import '../styles/Modal.css';

export default function EditExpenseModal({ expense, members, onClose, onUpdate }) {
    // Helper to get the correct ID for a member (User ID or Guest ID)
    const getMemberId = (member) => member.isGuest ? member.guestId : member.userId;

    // Initialize form with existing expense data
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Other',
        participants: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Populate form when expense data is available
    useEffect(() => {
        if (expense) {
            setFormData({
                amount: parseFloat(expense.amount).toFixed(2),
                description: expense.description,
                category: expense.category || 'Other',
                participants: expense.splits?.map(split => split.userId || split.guestId) || []
            });
        }
    }, [expense]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        if (formData.participants.length === 0) {
            setError('Select at least one participant');
            return;
        }

        try {
            setLoading(true);
            await onUpdate(expense._id, {
                amount: formData.amount,
                description: formData.description.trim(),
                category: formData.category,
                participants: formData.participants
            });
        } catch (err) {
            setError(err.message || 'Failed to update expense');
            setLoading(false);
        }
    };

    const toggleParticipant = (memberId) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(memberId)
                ? prev.participants.filter(id => id !== memberId)
                : [...prev.participants, memberId]
        }));
    };

    const selectAll = () => {
        setFormData(prev => ({
            ...prev,
            participants: members.map(m => getMemberId(m))
        }));
    };

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
                >
                    <div className="modal-header">
                        <h2>Edit Expense</h2>
                        <button onClick={onClose} className="modal-close">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <motion.div
                            className="input-group"
                            variants={expenseInputVariants}
                            whileFocus="focus"
                        >
                            <label htmlFor="amount" className="input-label">
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                id="amount"
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="input input-amount"
                                placeholder="0.00"
                                required
                            />
                        </motion.div>

                        <div className="input-group">
                            <label htmlFor="description" className="input-label">
                                Description
                            </label>
                            <input
                                type="text"
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input"
                                placeholder="Dinner, groceries, etc."
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="category" className="input-label">
                                Category
                            </label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="Food">🍔 Food</option>
                                <option value="Transport">🚗 Transport</option>
                                <option value="Accommodation">🏠 Accommodation</option>
                                <option value="Entertainment">🎬 Entertainment</option>
                                <option value="Shopping">🛍️ Shopping</option>
                                <option value="Utilities">💡 Utilities</option>
                                <option value="Other">📌 Other</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <div className="label-with-action">
                                <label className="input-label">Split With</label>
                                <button type="button" onClick={selectAll} className="select-all-btn">
                                    Select All
                                </button>
                            </div>
                            <div className="participants-list">
                                {members?.map((member) => {
                                    const memberId = getMemberId(member);
                                    return (
                                        <label key={memberId} className="participant-item">
                                            <input
                                                type="checkbox"
                                                checked={formData.participants.includes(memberId)}
                                                onChange={() => toggleParticipant(memberId)}
                                            />
                                            <span>{member.userName}</span>
                                            {member.isGuest && <span className="guest-badge">Guest</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Update Expense'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
}
