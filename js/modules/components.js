/**
 * Components Module - Reusable UI Components
 * 
 * Factory functions for creating UI components
 * Demonstrates: Component-based architecture, template literals, event delegation
 */

import { formatCurrency, formatDate, escapeHTML } from './utils.js';
import { CATEGORY_COLORS, createProgressBar, createChartLegend } from './charts.js';

// ============================================
// Category Configuration
// ============================================

export const CATEGORIES = {
    food: { icon: '🍔', name: 'Food' },
    travel: { icon: '✈️', name: 'Travel' },
    shopping: { icon: '🛍️', name: 'Shopping' },
    bills: { icon: '📄', name: 'Bills' },
    entertainment: { icon: '🎬', name: 'Entertainment' },
    health: { icon: '💊', name: 'Health' },
    other: { icon: '📦', name: 'Other' }
};

// ============================================
// Expense Components
// ============================================

/**
 * Create expense list item HTML
 * @param {Object} expense - Expense object
 * @returns {string} HTML string
 */
export function ExpenseItem(expense) {
    const categoryInfo = CATEGORIES[expense.category] || CATEGORIES.other;
    const formattedDate = formatDate(expense.date, 'relative');

    return `
        <li class="expense-item" data-id="${expense.id}">
            <div class="expense-category-icon">
                ${categoryInfo.icon}
            </div>
            <div class="expense-details">
                <span class="expense-description">${escapeHTML(expense.description)}</span>
                <div class="expense-meta">
                    <span class="expense-category-tag" data-category="${expense.category}">
                        ${categoryInfo.name}
                    </span>
                    <span class="expense-date">${formattedDate}</span>
                </div>
            </div>
            <div class="expense-right">
                <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                <button 
                    class="delete-btn" 
                    aria-label="Delete expense: ${escapeHTML(expense.description)}"
                    data-action="delete"
                    data-id="${expense.id}"
                >
                    🗑️
                </button>
            </div>
        </li>
    `;
}

/**
 * Create expense list HTML
 * @param {Array} expenses - Array of expenses
 * @returns {string} HTML string
 */
export function ExpenseList(expenses) {
    if (!expenses.length) {
        return EmptyState('expenses');
    }
    return `
        <ul class="expenses-list" role="list" aria-label="List of expenses">
            ${expenses.map(ExpenseItem).join('')}
        </ul>
    `;
}

// ============================================
// Summary Components
// ============================================

/**
 * Create total summary card HTML
 * @param {number} total - Total amount
 * @param {number} count - Number of expenses
 * @returns {string} HTML string
 */
export function TotalCard(total, count) {
    return `
        <article class="summary-card total-card">
            <span class="card-label">Total Spent</span>
            <span class="card-value">${formatCurrency(total)}</span>
            <span class="card-count">${count} expense${count !== 1 ? 's' : ''}</span>
        </article>
    `;
}

/**
 * Create category breakdown card HTML
 * @param {string} category - Category key
 * @param {number} amount - Category total
 * @param {number} total - Overall total (for percentage)
 * @returns {string} HTML string
 */
export function CategoryCard(category, amount, total) {
    const categoryInfo = CATEGORIES[category] || CATEGORIES.other;
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

    return `
        <article class="category-card" data-category="${category}">
            <span class="card-icon">${categoryInfo.icon}</span>
            <span class="card-name">${categoryInfo.name}</span>
            <span class="card-amount">${formatCurrency(amount)}</span>
            <span class="card-percentage">${percentage}%</span>
        </article>
    `;
}

/**
 * Create category breakdown section
 * @param {Object} categoryTotals - Object with category totals
 * @param {number} total - Overall total
 * @returns {string} HTML string
 */
export function CategoryBreakdown(categoryTotals, total) {
    const activeCategories = Object.entries(categoryTotals)
        .filter(([_, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1]);

    if (!activeCategories.length) {
        return '<div class="category-breakdown empty">No category data</div>';
    }

    return `
        <div class="category-breakdown">
            ${activeCategories.map(([cat, amount]) => CategoryCard(cat, amount, total)).join('')}
        </div>
    `;
}

// ============================================
// Form Components
// ============================================

/**
 * Create expense form HTML
 * @param {Object} options - Form options
 * @returns {string} HTML string
 */
export function ExpenseForm(options = {}) {
    const { editMode = false, expense = null } = options;
    const buttonText = editMode ? 'Update Expense' : 'Add Expense';

    return `
        <form id="expense-form" class="expense-form" novalidate>
            <div class="form-row">
                <div class="form-group">
                    <label for="amount">Amount ($)</label>
                    <input 
                        type="number" 
                        id="amount" 
                        name="amount" 
                        placeholder="0.00" 
                        min="0.01" 
                        step="0.01"
                        value="${expense?.amount || ''}"
                        required
                        aria-describedby="amount-error"
                    >
                    <span id="amount-error" class="error-message" role="alert"></span>
                </div>
                
                <div class="form-group">
                    <label for="category">Category</label>
                    <select id="category" name="category" required aria-describedby="category-error">
                        <option value="">Select category</option>
                        ${Object.entries(CATEGORIES).map(([key, { icon, name }]) => `
                            <option value="${key}" ${expense?.category === key ? 'selected' : ''}>
                                ${icon} ${name}
                            </option>
                        `).join('')}
                    </select>
                    <span id="category-error" class="error-message" role="alert"></span>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="description">Description</label>
                    <input 
                        type="text" 
                        id="description" 
                        name="description" 
                        placeholder="What did you spend on?"
                        maxlength="100"
                        value="${expense?.description || ''}"
                        aria-describedby="description-hint"
                    >
                    <span id="description-hint" class="hint-text">Optional - add a note</span>
                </div>
                
                <div class="form-group">
                    <label for="date">Date</label>
                    <input 
                        type="date" 
                        id="date" 
                        name="date"
                        value="${expense?.date?.split('T')[0] || new Date().toISOString().split('T')[0]}"
                    >
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary" id="submit-btn">
                <span class="btn-text">${buttonText}</span>
                <span class="btn-icon">→</span>
            </button>
            
            <div id="success-message" class="success-message" role="status" aria-live="polite">
                ✓ Expense ${editMode ? 'updated' : 'added'} successfully!
            </div>
        </form>
    `;
}

// ============================================
// Filter Components
// ============================================

/**
 * Create filter bar HTML
 * @param {Object} currentFilters - Current filter state
 * @returns {string} HTML string
 */
export function FilterBar(currentFilters = {}) {
    const { category = 'all', dateRange = 'all', sortBy = 'date-desc' } = currentFilters;

    return `
        <div class="filter-bar">
            <div class="filter-group">
                <label for="filter-search" class="visually-hidden">Search</label>
                <input 
                    type="search" 
                    id="filter-search" 
                    placeholder="Search expenses..."
                    class="filter-search"
                    aria-label="Search expenses"
                >
            </div>
            
            <div class="filter-group">
                <label for="filter-category" class="visually-hidden">Category</label>
                <select id="filter-category" class="filter-select">
                    <option value="all" ${category === 'all' ? 'selected' : ''}>All Categories</option>
                    ${Object.entries(CATEGORIES).map(([key, { icon, name }]) => `
                        <option value="${key}" ${category === key ? 'selected' : ''}>
                            ${icon} ${name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="filter-date" class="visually-hidden">Date Range</label>
                <select id="filter-date" class="filter-select">
                    <option value="all" ${dateRange === 'all' ? 'selected' : ''}>All Time</option>
                    <option value="today" ${dateRange === 'today' ? 'selected' : ''}>Today</option>
                    <option value="week" ${dateRange === 'week' ? 'selected' : ''}>This Week</option>
                    <option value="month" ${dateRange === 'month' ? 'selected' : ''}>This Month</option>
                    <option value="last30" ${dateRange === 'last30' ? 'selected' : ''}>Last 30 Days</option>
                    <option value="year" ${dateRange === 'year' ? 'selected' : ''}>This Year</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="filter-sort" class="visually-hidden">Sort By</label>
                <select id="filter-sort" class="filter-select">
                    <option value="date-desc" ${sortBy === 'date-desc' ? 'selected' : ''}>Newest First</option>
                    <option value="date-asc" ${sortBy === 'date-asc' ? 'selected' : ''}>Oldest First</option>
                    <option value="amount-desc" ${sortBy === 'amount-desc' ? 'selected' : ''}>Highest Amount</option>
                    <option value="amount-asc" ${sortBy === 'amount-asc' ? 'selected' : ''}>Lowest Amount</option>
                </select>
            </div>
        </div>
    `;
}

// ============================================
// Budget Components
// ============================================

/**
 * Create budget overview section
 * @param {Object} budgets - Budget limits by category
 * @param {Object} spent - Spent amounts by category
 * @returns {string} HTML string
 */
export function BudgetOverview(budgets, spent) {
    const budgetItems = Object.entries(budgets)
        .filter(([_, limit]) => limit > 0)
        .map(([category, limit]) => createProgressBar(category, spent[category] || 0, limit));

    if (!budgetItems.length) {
        return `
            <div class="budget-empty">
                <p>No budgets set yet. Set budgets in Settings to track your spending limits.</p>
            </div>
        `;
    }

    return `<div class="budget-overview">${budgetItems.join('')}</div>`;
}

/**
 * Create budget form HTML
 * @param {Object} currentBudgets - Current budget values
 * @returns {string} HTML string
 */
export function BudgetForm(currentBudgets = {}) {
    return `
        <form id="budget-form" class="budget-form">
            <p class="form-description">Set monthly spending limits for each category</p>
            ${Object.entries(CATEGORIES).map(([key, { icon, name }]) => `
                <div class="budget-input-group">
                    <label for="budget-${key}">
                        <span class="budget-icon">${icon}</span>
                        ${name}
                    </label>
                    <div class="budget-input-wrapper">
                        <span class="currency-prefix">$</span>
                        <input 
                            type="number" 
                            id="budget-${key}" 
                            name="${key}"
                            min="0"
                            step="10"
                            value="${currentBudgets[key] || ''}"
                            placeholder="No limit"
                        >
                    </div>
                </div>
            `).join('')}
            <button type="submit" class="btn btn-primary">Save Budgets</button>
        </form>
    `;
}

// ============================================
// Empty States
// ============================================

/**
 * Create empty state HTML
 * @param {string} type - Type of empty state
 * @returns {string} HTML string
 */
export function EmptyState(type = 'expenses') {
    const states = {
        expenses: {
            icon: '📭',
            title: 'No expenses yet',
            message: 'Start tracking your spending by adding your first expense above.'
        },
        filtered: {
            icon: '🔍',
            title: 'No matching expenses',
            message: 'Try adjusting your filters to see more results.'
        },
        analytics: {
            icon: '📊',
            title: 'Not enough data',
            message: 'Add some expenses to see your spending analytics.'
        }
    };

    const state = states[type] || states.expenses;

    return `
        <div class="empty-state">
            <div class="empty-icon">${state.icon}</div>
            <h3>${state.title}</h3>
            <p>${state.message}</p>
        </div>
    `;
}

// ============================================
// Modal Component
// ============================================

/**
 * Create modal HTML
 * @param {Object} options - Modal options
 * @returns {string} HTML string
 */
export function Modal({ id, title, content, actions = [] }) {
    return `
        <div id="${id}" class="modal" role="dialog" aria-labelledby="${id}-title" aria-modal="true">
            <div class="modal-backdrop" data-action="close-modal"></div>
            <div class="modal-content">
                <header class="modal-header">
                    <h2 id="${id}-title">${title}</h2>
                    <button class="modal-close" data-action="close-modal" aria-label="Close modal">×</button>
                </header>
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length ? `
                    <footer class="modal-footer">
                        ${actions.map(action => `
                            <button class="btn ${action.class || ''}" data-action="${action.action}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </footer>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================
// Toast Notifications
// ============================================

/**
 * Create toast notification HTML
 * @param {Object} options - Toast options
 * @returns {string} HTML string
 */
export function Toast({ message, type = 'success', duration = 3000 }) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    return `
        <div class="toast toast-${type}" role="alert" data-duration="${duration}">
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Dismiss">&times;</button>
        </div>
    `;
}

// ============================================
// Navigation Component
// ============================================

/**
 * Create navigation HTML
 * @param {string} currentView - Current active view
 * @returns {string} HTML string
 */
export function Navigation(currentView = 'dashboard') {
    const navItems = [
        { route: 'dashboard', icon: '📊', label: 'Dashboard' },
        { route: 'analytics', icon: '📈', label: 'Analytics' },
        { route: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    return `
        <nav class="main-nav" role="navigation" aria-label="Main navigation">
            ${navItems.map(item => `
                <a 
                    href="#${item.route}" 
                    class="nav-link ${currentView === item.route ? 'active' : ''}"
                    data-route="${item.route}"
                    aria-current="${currentView === item.route ? 'page' : 'false'}"
                >
                    <span class="nav-icon">${item.icon}</span>
                    <span class="nav-label">${item.label}</span>
                </a>
            `).join('')}
        </nav>
    `;
}

// ============================================
// Stats Cards for Analytics
// ============================================

/**
 * Create stats card HTML
 * @param {Object} options - Stats options
 * @returns {string} HTML string
 */
export function StatsCard({ label, value, change, icon }) {
    const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';

    return `
        <article class="stats-card">
            <div class="stats-icon">${icon}</div>
            <div class="stats-content">
                <span class="stats-value">${value}</span>
                <span class="stats-label">${label}</span>
                ${change !== undefined ? `
                    <span class="stats-change ${changeClass}">
                        ${changeIcon} ${Math.abs(change)}%
                    </span>
                ` : ''}
            </div>
        </article>
    `;
}

export { createProgressBar, createChartLegend };

