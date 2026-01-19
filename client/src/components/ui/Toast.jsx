import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Sparkles } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = ({ title, message, type = 'info', duration = 4000 }) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, title, message, type, duration, isExiting: false }]);

        if (duration > 0) {
            setTimeout(() => {
                // Start exit animation
                setToasts((prev) =>
                    prev.map((toast) =>
                        toast.id === id ? { ...toast, isExiting: true } : toast
                    )
                );
                // Remove after animation completes
                setTimeout(() => {
                    removeToast(id);
                }, 300);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const handleClose = (id) => {
        setToasts((prev) =>
            prev.map((toast) =>
                toast.id === id ? { ...toast, isExiting: true } : toast
            )
        );
        setTimeout(() => {
            removeToast(id);
        }, 300);
    };

    const toast = {
        success: (title, message) => addToast({ title, message, type: 'success' }),
        error: (title, message) => addToast({ title, message, type: 'error' }),
        warning: (title, message) => addToast({ title, message, type: 'warning' }),
        info: (title, message) => addToast({ title, message, type: 'info' }),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onClose={handleClose} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onClose }) {
    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={() => onClose(toast.id)} />
            ))}
        </div>
    );
}

function Toast({ title, message, type, duration, isExiting, onClose }) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (duration > 0) {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    const decrement = 100 / (duration / 50);
                    return Math.max(0, prev - decrement);
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, [duration]);

    const configs = {
        success: {
            icon: <CheckCircle className="h-5 w-5" />,
            gradient: 'from-emerald-500 to-teal-500',
            bgGlow: 'bg-emerald-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            textColor: 'text-emerald-600',
            progressGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
        },
        error: {
            icon: <XCircle className="h-5 w-5" />,
            gradient: 'from-rose-500 to-red-500',
            bgGlow: 'bg-rose-500/10',
            iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
            textColor: 'text-rose-600',
            progressGradient: 'from-rose-400 via-red-500 to-rose-600',
        },
        warning: {
            icon: <AlertCircle className="h-5 w-5" />,
            gradient: 'from-amber-500 to-orange-500',
            bgGlow: 'bg-amber-500/10',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            textColor: 'text-amber-600',
            progressGradient: 'from-amber-400 via-orange-500 to-amber-600',
        },
        info: {
            icon: <Info className="h-5 w-5" />,
            gradient: 'from-blue-500 to-indigo-500',
            bgGlow: 'bg-blue-500/10',
            iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            textColor: 'text-blue-600',
            progressGradient: 'from-blue-400 via-indigo-500 to-blue-600',
        },
    };

    const config = configs[type];

    return (
        <div
            className={`
                pointer-events-auto
                relative overflow-hidden
                bg-white/95 backdrop-blur-xl
                rounded-2xl
                shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]
                border border-white/60
                min-w-[340px] max-w-[420px]
                transform transition-all duration-300 ease-out
                ${isExiting
                    ? 'animate-toast-exit opacity-0 translate-x-full'
                    : 'animate-toast-enter'
                }
            `}
            style={{
                boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
        >
            {/* Subtle glow effect */}
            <div className={`absolute inset-0 ${config.bgGlow} opacity-50 blur-xl`} />

            {/* Content */}
            <div className="relative p-4">
                <div className="flex items-start gap-3.5">
                    {/* Animated Icon Container */}
                    <div className={`
                        relative flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg}
                        flex items-center justify-center
                        shadow-lg
                        animate-icon-pop
                    `}>
                        <div className="text-white">
                            {config.icon}
                        </div>
                        {/* Icon glow */}
                        <div className={`absolute inset-0 rounded-xl ${config.iconBg} blur-md opacity-40`} />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        {title && (
                            <p className="font-semibold text-[15px] text-gray-900 leading-tight">
                                {title}
                            </p>
                        )}
                        {message && (
                            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                                {message}
                            </p>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="
                            flex-shrink-0 w-7 h-7 rounded-lg
                            flex items-center justify-center
                            text-gray-400 hover:text-gray-600
                            hover:bg-gray-100/80
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-gray-200
                        "
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="h-1 bg-gray-100/80 overflow-hidden">
                <div
                    className={`
                        h-full bg-gradient-to-r ${config.progressGradient}
                        transition-all duration-75 ease-linear
                        relative
                    `}
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer effect on progress bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>
        </div>
    );
}

export default ToastProvider;
