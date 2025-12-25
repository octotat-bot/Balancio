import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { modalVariants, backdropVariants } from '../animations/variants';

const CATEGORIES = [
    { value: 'trip', label: '✈️ Trip', icon: '✈️' },
    { value: 'apartment', label: '🏠 Apartment', icon: '🏠' },
    { value: 'event', label: '🎉 Event', icon: '🎉' },
    { value: 'project', label: '💼 Project', icon: '💼' },
    { value: 'other', label: '📋 Other', icon: '📋' }
];

export default function CreateGroupModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'other'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Group name is required');
            return;
        }

        try {
            setLoading(true);
            await onCreate(formData);
        } catch (err) {
            console.error('Create group error:', err);
            const errorMessage = err?.message || (typeof err === 'string' ? err : 'Failed to create group');
            setError(errorMessage);
            setLoading(false);
        }
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
                    className="modal-container enhanced-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-title-section">
                            <h2>Create New Group</h2>
                            <p className="modal-subtitle">Organize your shared expenses</p>
                        </div>
                        <button onClick={onClose} className="modal-close">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form enhanced-form">
                        {/* Group Name */}
                        <div className="input-group">
                            <label htmlFor="groupName" className="input-label">
                                <span className="label-icon">📝</span>
                                Group Name
                                <span className="required-star">*</span>
                            </label>
                            <input
                                type="text"
                                id="groupName"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input enhanced-input"
                                placeholder="e.g., Goa Trip 2024, Apartment Rent, Birthday Party"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Category Selection */}
                        <div className="input-group">
                            <label className="input-label">
                                <span className="label-icon">🏷️</span>
                                Category
                            </label>
                            <div className="category-grid">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        className={`category-option ${formData.category === cat.value ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                                    >
                                        <span className="category-icon">{cat.icon}</span>
                                        <span className="category-label">{cat.label.replace(/^.+ /, '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="input-group">
                            <label htmlFor="description" className="input-label">
                                <span className="label-icon">💬</span>
                                Description
                                <span className="optional-tag">(Optional)</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="input enhanced-input textarea-input"
                                placeholder="Add details about this group, what expenses you'll track, or any important notes..."
                                rows="3"
                                maxLength="500"
                            />
                            <div className="char-count">
                                {formData.description.length}/500
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                className="error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner"></span> : '✨ Create Group'}
                            </button>
                        </div>

                        <div className="modal-footer-note">
                            <p>💡 You can add members after creating the group</p>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
}
