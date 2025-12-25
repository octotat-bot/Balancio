import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { modalVariants, backdropVariants, expenseInputVariants } from '../animations/variants';
import '../styles/Modal.css';

export default function AddExpenseModal({ groupId, members, onClose, onCreate }) {
    // Helper to get the correct ID for a member (User ID or Guest ID)
    const getMemberId = (member) => member.isGuest ? member.guestId : member.userId;

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Other',
        splitType: 'EQUAL',
        participants: members?.map(m => getMemberId(m)) || [],
        items: [],
        commonCharges: { amount: '', description: 'Tax & Tip' }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentItem, setCurrentItem] = useState({ name: '', amount: '', sharedBy: [] });

    const addItem = () => {
        if (!currentItem.name || !currentItem.amount || currentItem.sharedBy.length === 0) {
            setError('Please fill all item fields and select participants');
            return;
        }
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...currentItem }]
        }));
        setCurrentItem({ name: '', amount: '', sharedBy: [] });
        setError('');
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calculateItemizedTotal = () => {
        const itemsTotal = formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const commonTotal = parseFloat(formData.commonCharges.amount || 0);
        return (itemsTotal + commonTotal).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        if (formData.splitType === 'EQUAL') {
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                setError('Amount must be greater than 0');
                return;
            }
            if (formData.participants.length === 0) {
                setError('Select at least one participant');
                return;
            }
        } else {
            // ITEMIZED validation
            if (formData.items.length === 0) {
                setError('Add at least one item');
                return;
            }
        }

        try {
            setLoading(true);
            const payload = {
                groupId,
                description: formData.description.trim(),
                category: formData.category,
                splitType: formData.splitType
            };

            if (formData.splitType === 'EQUAL') {
                payload.amount = formData.amount;
                payload.participants = formData.participants;
            } else {
                payload.amount = calculateItemizedTotal();
                payload.items = formData.items;
                payload.commonCharges = formData.commonCharges;
            }

            await onCreate(payload);
        } catch (err) {
            setError(err.message || 'Failed to create expense');
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
                    style={{
                        maxWidth: '1000px',
                        width: '95%',
                        maxHeight: '95vh',
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-header">
                        <h2>Add Expense</h2>
                        <button onClick={onClose} className="modal-close">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
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

                        {/* Split Type Toggle */}
                        <div className="input-group">
                            <label className="input-label">Split Type</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, splitType: 'EQUAL' })}
                                    className={`btn ${formData.splitType === 'EQUAL' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '10px' }}
                                >
                                    ⚖️ Equal Split
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, splitType: 'ITEMIZED' })}
                                    className={`btn ${formData.splitType === 'ITEMIZED' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '10px' }}
                                >
                                    📋 Itemized
                                </button>
                            </div>
                        </div>

                        {formData.splitType === 'ITEMIZED' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '12px' }}>
                                {/* Left Column - Add Item Form (Compact) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Add Item Form - Horizontal Layout */}
                                    <div style={{
                                        border: '2px dashed var(--border-color)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'var(--bg-secondary)'
                                    }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                            ➕ Add Item
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'start' }}>
                                            <input
                                                type="text"
                                                placeholder="Item name"
                                                value={currentItem.name}
                                                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                                                className="input"
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="₹ Amount"
                                                value={currentItem.amount}
                                                onChange={(e) => setCurrentItem({ ...currentItem, amount: e.target.value })}
                                                className="input"
                                                style={{ fontSize: '14px', padding: '8px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="btn btn-primary"
                                                style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* Participants - Horizontal Chips */}
                                        <div style={{ marginTop: '8px' }}>
                                            <div style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                                Shared by:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {members?.map((member) => {
                                                    const memberId = getMemberId(member);
                                                    const isSelected = currentItem.sharedBy.includes(memberId);
                                                    return (
                                                        <button
                                                            key={memberId}
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentItem(prev => ({
                                                                    ...prev,
                                                                    sharedBy: prev.sharedBy.includes(memberId)
                                                                        ? prev.sharedBy.filter(id => id !== memberId)
                                                                        : [...prev.sharedBy, memberId]
                                                                }));
                                                            }}
                                                            style={{
                                                                padding: '4px 10px',
                                                                fontSize: '12px',
                                                                borderRadius: '16px',
                                                                border: `1.5px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                                                                background: isSelected ? 'var(--primary-500)' : 'transparent',
                                                                color: isSelected ? 'white' : 'var(--text-primary)',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                fontWeight: isSelected ? 600 : 400
                                                            }}
                                                        >
                                                            {isSelected && '✓ '}{member.userName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List - Compact */}
                                    <div style={{
                                        flex: 1,
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        maxHeight: '280px',
                                        overflowY: 'auto'
                                    }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                            📋 Items ({formData.items.length})
                                        </div>
                                        {formData.items.length === 0 ? (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '30px 10px',
                                                color: 'var(--text-secondary)',
                                                fontSize: '13px'
                                            }}>
                                                No items yet
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {formData.items.map((item, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '8px 10px',
                                                        background: 'var(--bg-secondary)',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.name}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                ₹{parseFloat(item.amount).toFixed(2)} • {item.sharedBy.length} people
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(idx)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                padding: '4px'
                                                            }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column - Summary */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Common Charges */}
                                    <div style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                            💰 Common Charges
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00 (Tax, Tip)"
                                            value={formData.commonCharges.amount}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                commonCharges: { ...formData.commonCharges, amount: e.target.value }
                                            })}
                                            className="input"
                                            style={{ fontSize: '14px', padding: '8px' }}
                                        />
                                        <small style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                                            Optional - split equally
                                        </small>
                                    </div>

                                    {/* Total Display */}
                                    <div style={{
                                        padding: '16px',
                                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        color: 'white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                                            Total Bill
                                        </div>
                                        <div style={{ fontSize: '28px', fontWeight: 700 }}>
                                            ₹{calculateItemizedTotal()}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div style={{
                                        padding: '12px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Items:</span>
                                            <span style={{ fontWeight: 600 }}>{formData.items.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Common:</span>
                                            <span style={{ fontWeight: 600 }}>₹{parseFloat(formData.commonCharges.amount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Equal Split - Amount Field */}
                                <div className="input-group">
                                    <label htmlFor="equalAmount" className="input-label">
                                        Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        id="equalAmount"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="input input-amount"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                {/* Participants Selection */}
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
                            </>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Create Expense'}
                            </button>
                        </div>
                    </form >
                </motion.div >
            </motion.div >
        </>
    );
}
