import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { modalVariants, backdropVariants } from '../animations/variants';
import '../styles/Modal.css';

export default function AddMemberModal({ onClose, onAdd }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const countryCodes = [
        { code: '+1', country: 'US/CA', flag: '🇺🇸' },
        { code: '+44', country: 'UK', flag: '🇬🇧' },
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+86', country: 'China', flag: '🇨🇳' },
        { code: '+81', country: 'Japan', flag: '🇯🇵' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (!phone.trim()) {
            setError('Phone number is required');
            return;
        }

        try {
            setLoading(true);
            const fullPhone = countryCode + phone.trim().replace(/^\+/, '');
            await onAdd({ name: name.trim(), phone: fullPhone });
        } catch (err) {
            setError(err.message || 'Failed to add member');
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
                    className="modal-container"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-title-section">
                            <h2>Add Member</h2>
                            <p className="modal-subtitle">Add someone to split expenses with</p>
                        </div>
                        <button onClick={onClose} className="modal-close">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="input-group">
                            <label htmlFor="name" className="input-label">
                                <span className="label-icon">👤</span>
                                Name
                                <span className="required-star">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                className="input"
                                placeholder="e.g., John, Sarah, Mom..."
                                autoFocus
                                required
                                minLength={2}
                                maxLength={100}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="phone" className="input-label">
                                <span className="label-icon">📱</span>
                                Phone Number
                                <span className="required-star">*</span>
                            </label>
                            <div className="phone-input-wrapper">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="country-code-select"
                                >
                                    {countryCodes.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.flag} {country.code}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setError('');
                                    }}
                                    className="input phone-number-input"
                                    placeholder="1234567890"
                                    required
                                />
                            </div>
                            <small className="input-hint">
                                💡 No account needed! If they sign up later, they'll auto-join.
                            </small>
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
                                {loading ? <span className="spinner"></span> : '✨ Add Member'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
}
