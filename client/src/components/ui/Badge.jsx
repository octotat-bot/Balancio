import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', style = {} }) {
    const variants = {
        default: { bg: '#f4f4f5', color: '#3f3f46', border: '#e4e4e7' },
        success: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
        warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
        danger: { bg: '#fef2f2', color: '#e11d48', border: '#fecdd3' },
        primary: { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' },
    };

    const v = variants[variant] || variants.default;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: size === 'sm' ? '2px 8px' : '4px 12px',
            borderRadius: '9999px',
            fontSize: size === 'sm' ? '12px' : '13px',
            fontWeight: '500',
            backgroundColor: v.bg,
            color: v.color,
            border: `1px solid ${v.border}`,
            ...style
        }}>
            {children}
        </span>
    );
}

export default Badge;
