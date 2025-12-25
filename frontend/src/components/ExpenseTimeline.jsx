import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listItemVariants } from '../animations/variants';
import { getCategoryIcon, getCategoryColor } from '../utils/categories';
import ExpenseDetailModal from './ExpenseDetailModal';
import '../styles/ExpenseTimeline.css';

export default function ExpenseTimeline({ expenses, onRefresh, isAdmin, currentUserId, onEdit, onDelete, onFilterChange }) {
    const [filters, setFilters] = useState({
        category: 'All',
        search: '',
        sortBy: 'newest'
    });
    const [selectedExpense, setSelectedExpense] = useState(null);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };
    if (!expenses || expenses.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No expenses yet</h3>
                <p>Add your first expense to start tracking</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="expense-timeline-container">
            <div className="timeline-header">
                <h2 className="section-title">Expense History</h2>
                <p className="section-description">
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
                </p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="filter-select"
                    >
                        <option value="All">All Categories</option>
                        <option value="Food">🍔 Food</option>
                        <option value="Transport">🚗 Transport</option>
                        <option value="Accommodation">🏠 Accommodation</option>
                        <option value="Entertainment">🎬 Entertainment</option>
                        <option value="Shopping">🛍️ Shopping</option>
                        <option value="Utilities">💡 Utilities</option>
                        <option value="Other">📌 Other</option>
                    </select>
                </div>

                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="filter-search"
                    />
                </div>

                <div className="filter-group">
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="filter-select"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Amount</option>
                        <option value="lowest">Lowest Amount</option>
                    </select>
                </div>
            </div>

            <div className="timeline">
                {expenses.map((expense, index) => (
                    <motion.div
                        key={expense._id}
                        className="timeline-item"
                        variants={listItemVariants}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="timeline-marker" />
                        <div
                            className="timeline-content"
                            onClick={() => setSelectedExpense(expense)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="expense-header">
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h3 className="expense-description">{expense.description}</h3>
                                        <span
                                            className="category-badge"
                                            style={{ backgroundColor: getCategoryColor(expense.category) + '20', color: getCategoryColor(expense.category) }}
                                        >
                                            {getCategoryIcon(expense.category)} {expense.category || 'Other'}
                                        </span>
                                        {expense.splitType === 'ITEMIZED' && (
                                            <span
                                                className="category-badge"
                                                style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}
                                            >
                                                📋 Itemized
                                            </span>
                                        )}
                                    </div>
                                    <p className="expense-meta">
                                        Paid by {expense.paidBy.name} · {formatDate(expense.createdAt)}
                                        {expense.splitType === 'ITEMIZED' && expense.items && ` · ${expense.items.length} items`}
                                        {' · Click to view details'}
                                    </p>
                                </div>
                                <div className="expense-right">
                                    <div className="expense-amount">
                                        ₹{parseFloat(expense.amount).toFixed(2)}
                                    </div>
                                    {(isAdmin || expense.paidBy._id === currentUserId) && (
                                        <div className="expense-actions" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="btn-expense-action edit"
                                                onClick={() => onEdit(expense)}
                                                title="Edit expense"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-expense-action delete"
                                                onClick={() => onDelete(expense)}
                                                title="Delete expense"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expense.splits && expense.splits.length > 0 && (
                                <div className="expense-splits">
                                    <div className="splits-label">Split among:</div>
                                    <div className="splits-list">
                                        {expense.splits.map((split) => (
                                            <div key={split.userId} className="split-item">
                                                <span className="split-name">{split.userName}</span>
                                                <span className="split-amount">
                                                    ₹{parseFloat(split.shareAmount).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Expense Detail Modal */}
            <AnimatePresence>
                {selectedExpense && (
                    <ExpenseDetailModal
                        expense={selectedExpense}
                        onClose={() => setSelectedExpense(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
