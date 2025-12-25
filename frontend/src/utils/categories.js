// Category utilities and constants
export const EXPENSE_CATEGORIES = [
    { value: 'Food', label: '🍔 Food', color: '#ef4444' },
    { value: 'Transport', label: '🚗 Transport', color: '#3b82f6' },
    { value: 'Accommodation', label: '🏠 Accommodation', color: '#8b5cf6' },
    { value: 'Entertainment', label: '🎬 Entertainment', color: '#ec4899' },
    { value: 'Shopping', label: '🛍️ Shopping', color: '#f59e0b' },
    { value: 'Utilities', label: '💡 Utilities', color: '#10b981' },
    { value: 'Other', label: '📌 Other', color: '#6b7280' }
];

export const getCategoryIcon = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label.split(' ')[0] : '📌';
};

export const getCategoryColor = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : '#6b7280';
};

export const getCategoryLabel = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : '📌 Other';
};
