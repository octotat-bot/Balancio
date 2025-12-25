import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

/**
 * AUTH CONTEXT
 * Manages authentication state across the application
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user from sessionStorage on mount (tab-specific)
    useEffect(() => {
        const loadUser = async () => {
            const token = sessionStorage.getItem('token');
            const savedUser = sessionStorage.getItem('user');

            if (token && savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                    // Optionally verify token is still valid
                    const response = await authAPI.getCurrentUser();
                    if (response.success) {
                        setUser(response.data.user);
                        sessionStorage.setItem('user', JSON.stringify(response.data.user));
                    }
                } catch (err) {
                    console.error('Failed to load user:', err);
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });

            if (response.success) {
                const { token, user } = response.data;
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                return { success: true };
            }
        } catch (err) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const register = async (name, email, phone, password) => {
        try {
            setError(null);
            const response = await authAPI.register({ name, email, phone, password });

            if (response.success) {
                const { token, user } = response.data;
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                return { success: true };
            }
        } catch (err) {
            const errorMessage = err.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
