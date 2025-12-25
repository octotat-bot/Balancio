import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthPage.css';

/**
 * AUTH PAGE - MATTE PREMIUM EDITION
 * High-end, professional feel with "Physical" UI and rich animations
 */

export default function AuthPage() {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [countryCode, setCountryCode] = useState('+91'); // Default to India
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [greeting, setGreeting] = useState('');

    // Popular country codes
    const countryCodes = [
        { code: '+1', country: 'US/CA', flag: '🇺🇸' },
        { code: '+44', country: 'UK', flag: '🇬🇧' },
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+86', country: 'China', flag: '🇨🇳' },
        { code: '+81', country: 'Japan', flag: '🇯🇵' },
        { code: '+49', country: 'Germany', flag: '🇩🇪' },
        { code: '+33', country: 'France', flag: '🇫🇷' },
        { code: '+61', country: 'Australia', flag: '🇦🇺' },
        { code: '+55', country: 'Brazil', flag: '🇧🇷' },
        { code: '+7', country: 'Russia', flag: '🇷🇺' },
        { code: '+82', country: 'S. Korea', flag: '🇰🇷' },
        { code: '+34', country: 'Spain', flag: '🇪🇸' },
        { code: '+39', country: 'Italy', flag: '🇮🇹' },
        { code: '+52', country: 'Mexico', flag: '🇲🇽' },
        { code: '+27', country: 'S. Africa', flag: '🇿🇦' },
    ];

    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Human Touch: Time-based greeting
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (mode === 'login') {
                result = await login(formData.email, formData.password);
            } else {
                if (!formData.name.trim()) {
                    setError('Please tell us your name.');
                    setLoading(false);
                    return;
                }
                if (!formData.phone.trim()) {
                    setError('Please provide your phone number.');
                    setLoading(false);
                    return;
                }
                // Combine country code with phone number
                const fullPhone = countryCode + formData.phone.replace(/^\+/, '');
                result = await register(formData.name, formData.email, fullPhone, formData.password);
            }

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error || 'Access denied.');
            }
        } catch (err) {
            setError(err.message || 'A technical issue occurred.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode) => {
        if (mode === newMode) return;
        setMode(newMode);
        setError('');
    };

    return (
        <div className="matte-auth-wrapper">
            <div
                className="matte-auth-container"
                style={{ flexDirection: mode === 'login' ? 'row' : 'row-reverse' }}
            >
                {/* Main Form Area */}
                <motion.div
                    className="matte-form-area"
                    layout
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                    <div className="form-header-mobile">
                        <span className="logo-text-mobile">BALANCIO</span>
                    </div>

                    <div className="toggle-pill-container">
                        <div className="toggle-pill">
                            <button
                                className={`toggle-option ${mode === 'login' ? 'active' : ''}`}
                                onClick={() => switchMode('login')}
                                style={{ position: 'relative' }}
                            >
                                <span style={{ position: 'relative', zIndex: 10 }}>Log In</span>
                                {mode === 'login' && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="toggle-glider-bg"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'white',
                                            borderRadius: '20px',
                                            zIndex: 0
                                        }}
                                    />
                                )}
                            </button>
                            <button
                                className={`toggle-option ${mode === 'register' ? 'active' : ''}`}
                                onClick={() => switchMode('register')}
                                style={{ position: 'relative' }}
                            >
                                <span style={{ position: 'relative', zIndex: 10 }}>Sign Up</span>
                                {mode === 'register' && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="toggle-glider-bg"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'white',
                                            borderRadius: '20px',
                                            zIndex: 0
                                        }}
                                    />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-content-wrapper">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, x: mode === 'login' ? -100 : 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: mode === 'login' ? 100 : -100 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="form-inner"
                            >
                                <div className="form-greeting">
                                    <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                                    <p>
                                        {mode === 'login'
                                            ? `${greeting}. Please enter your details.`
                                            : 'Experience the premium way to split costs.'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="premium-form">
                                    {mode === 'register' && (
                                        <motion.div
                                            className="input-group"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Jane Doe"
                                                autoComplete="name"
                                                className="matte-input"
                                            />
                                        </motion.div>
                                    )}

                                    <div className="input-group">
                                        <label>{mode === 'login' ? 'Email or Phone' : 'Email Address'}</label>
                                        <input
                                            type={mode === 'login' ? 'text' : 'email'}
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder={mode === 'login' ? 'email@example.com or +1234567890' : 'name@example.com'}
                                            autoComplete="username"
                                            className="matte-input"
                                            required
                                        />
                                    </div>

                                    {mode === 'register' && (
                                        <motion.div
                                            className="input-group"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <label>Phone Number</label>
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
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="1234567890"
                                                    autoComplete="tel"
                                                    className="matte-input phone-number-input"
                                                    required
                                                />
                                            </div>
                                            <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                Select country code and enter your number
                                            </small>
                                        </motion.div>
                                    )}

                                    <div className="input-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            autoComplete={mode === 'login' ? "current-password" : "new-password"}
                                            className="matte-input"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <motion.div
                                            className="error-banner"
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <motion.button
                                        type="submit"
                                        className="action-button"
                                        disabled={loading}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {loading ? (
                                            <span className="loader-dot"></span>
                                        ) : (
                                            mode === 'login' ? 'Sign In' : 'Get Started'
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Visual Sidebar (Desktop Only) */}
                <motion.div
                    className="matte-sidebar"
                    layout
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                    <div className="sidebar-logo">
                        <div className="logo-symbol">B</div>
                        <span className="logo-text">BALANCIO</span>
                    </div>

                    <div className="sidebar-content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode === 'login' ? 'login-text' : 'signup-text'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="sidebar-heading">
                                    {mode === 'login' ? (
                                        <>Return to<br />Clarity.</>
                                    ) : (
                                        <>Begin your<br />Journey.</>
                                    )}
                                </h1>
                                <p className="sidebar-sub">
                                    {mode === 'login'
                                        ? 'Track expenses with precision and elegance.'
                                        : 'Join a community that values fairness and transparency.'}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="sidebar-footer">
                        <p>&copy; 2024 Balancio Financial.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
