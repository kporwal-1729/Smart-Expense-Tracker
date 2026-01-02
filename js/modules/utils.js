/**
 * Utilities Module - Helper Functions
 * 
 * Collection of pure utility functions
 * Demonstrates: Functional programming, Intl API, date manipulation
 */

// ============================================
// ID Generation
// ============================================

/**
 * Generate unique ID using timestamp and random string
 * @returns {string} Unique identifier
 */
export function generateId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID v4
 * @returns {string} UUID string
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// Currency Formatting
// ============================================

const currencyFormatters = new Map();

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
    if (!currencyFormatters.has(currency)) {
        currencyFormatters.set(currency, new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }));
    }
    return currencyFormatters.get(currency).format(amount);
}

/**
 * Format number with compact notation (1K, 1M, etc.)
 * @param {number} num - Number to format
 * @returns {string} Compact formatted string
 */
export function formatCompact(num) {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short'
    }).format(num);
}

// ============================================
// Date Utilities
// ============================================

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
    const d = new Date(date);
    
    switch (format) {
        case 'long':
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(d);
        
        case 'relative':
            return getRelativeTime(d);
        
        case 'month':
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long'
            }).format(d);
        
        case 'iso':
            return d.toISOString().split('T')[0];
        
        case 'short':
        default:
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).format(d);
    }
}

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const diff = date - now;
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diff / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diff / (1000 * 60));

    if (Math.abs(diffMinutes) < 60) {
        return rtf.format(diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffDays) < 30) {
        return rtf.format(diffDays, 'day');
    } else {
        return formatDate(date, 'short');
    }
}

/**
 * Get date range boundaries
 * @param {string} range - Range type: 'today', 'week', 'month', 'year'
 * @returns {Object} { start: Date, end: Date }
 */
export function getDateRange(range) {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    end.setHours(23, 59, 59, 999);

    switch (range) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        
        case 'week':
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            break;
        
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        
        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            break;
        
        case 'last30':
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
        
        case 'last90':
            start.setDate(now.getDate() - 90);
            start.setHours(0, 0, 0, 0);
            break;
        
        default:
            start.setFullYear(1970);
    }

    return { start, end };
}

/**
 * Group dates by period
 * @param {Array} items - Items with date property
 * @param {string} period - 'day', 'week', 'month'
 * @returns {Map} Grouped items
 */
export function groupByPeriod(items, period = 'day') {
    const groups = new Map();

    items.forEach(item => {
        const date = new Date(item.date);
        let key;

        switch (period) {
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            
            case 'day':
            default:
                key = date.toISOString().split('T')[0];
        }

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });

    return groups;
}

// ============================================
// Array Utilities
// ============================================

/**
 * Sort array by property
 * @param {Array} arr - Array to sort
 * @param {string} prop - Property to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export function sortBy(arr, prop, order = 'desc') {
    return [...arr].sort((a, b) => {
        let valA = a[prop];
        let valB = b[prop];

        // Handle dates
        if (prop === 'date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }

        if (order === 'asc') {
            return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
    });
}

/**
 * Group array by property
 * @param {Array} arr - Array to group
 * @param {string} prop - Property to group by
 * @returns {Object} Grouped object
 */
export function groupBy(arr, prop) {
    return arr.reduce((groups, item) => {
        const key = item[prop];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

// ============================================
// DOM Utilities
// ============================================

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataVal]) => {
                el.dataset[dataKey] = dataVal;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });

    if (typeof children === 'string') {
        el.textContent = children;
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                el.appendChild(child);
            }
        });
    }

    return el;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function calls
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Calculation Utilities
// ============================================

/**
 * Calculate statistics for number array
 * @param {Array<number>} numbers - Array of numbers
 * @returns {Object} Statistics object
 */
export function calculateStats(numbers) {
    if (!numbers.length) {
        return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    return {
        sum,
        avg: sum / numbers.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        count: numbers.length
    };
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

