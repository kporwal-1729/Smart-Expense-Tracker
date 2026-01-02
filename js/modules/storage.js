/**
 * Storage Module - Persistent Data Layer
 * 
 * Handles all Local Storage operations with error handling
 * Demonstrates: Try/catch, JSON parsing, data validation
 */

const STORAGE_KEYS = {
    EXPENSES: 'expenseflow_expenses',
    SETTINGS: 'expenseflow_settings',
    BUDGETS: 'expenseflow_budgets'
};

/**
 * Generic storage operations
 */
const storage = {
    /**
     * Get item from storage with JSON parsing
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`[Storage] Error reading ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in storage with JSON stringify
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`[Storage] Error writing ${key}:`, error);
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                this._handleQuotaExceeded();
            }
            return false;
        }
    },

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`[Storage] Error removing ${key}:`, error);
        }
    },

    /**
     * Clear all app data
     */
    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => this.remove(key));
    },

    /**
     * Get storage usage info
     * @returns {Object} Usage statistics
     */
    getUsageInfo() {
        let totalSize = 0;
        const breakdown = {};

        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            const item = localStorage.getItem(key);
            const size = item ? new Blob([item]).size : 0;
            breakdown[name] = size;
            totalSize += size;
        });

        return {
            totalBytes: totalSize,
            totalKB: (totalSize / 1024).toFixed(2),
            breakdown,
            estimatedLimit: 5 * 1024 * 1024 // ~5MB typical limit
        };
    },

    /**
     * Handle quota exceeded error
     * @private
     */
    _handleQuotaExceeded() {
        console.warn('[Storage] Quota exceeded. Consider clearing old data.');
        // Could emit event or show notification
    }
};

/**
 * Expense-specific storage operations
 */
const expenseStorage = {
    /**
     * Load all expenses
     * @returns {Array} Expenses array
     */
    load() {
        const expenses = storage.get(STORAGE_KEYS.EXPENSES, []);
        // Validate and migrate data if needed
        return this._validateExpenses(expenses);
    },

    /**
     * Save all expenses
     * @param {Array} expenses - Expenses to save
     */
    save(expenses) {
        storage.set(STORAGE_KEYS.EXPENSES, expenses);
    },

    /**
     * Validate expense data structure
     * @param {Array} expenses - Raw expenses
     * @returns {Array} Validated expenses
     * @private
     */
    _validateExpenses(expenses) {
        if (!Array.isArray(expenses)) return [];
        
        return expenses.filter(exp => {
            return (
                exp &&
                typeof exp.id === 'string' &&
                typeof exp.amount === 'number' &&
                typeof exp.category === 'string' &&
                typeof exp.date === 'string'
            );
        });
    },

    /**
     * Export expenses to JSON
     * @param {Array} expenses - Expenses to export
     * @returns {string} JSON string
     */
    exportJSON(expenses) {
        return JSON.stringify(expenses, null, 2);
    },

    /**
     * Export expenses to CSV
     * @param {Array} expenses - Expenses to export
     * @returns {string} CSV string
     */
    exportCSV(expenses) {
        const headers = ['Date', 'Category', 'Description', 'Amount'];
        const rows = expenses.map(exp => [
            new Date(exp.date).toLocaleDateString(),
            exp.category,
            `"${exp.description.replace(/"/g, '""')}"`,
            exp.amount.toFixed(2)
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
};

/**
 * Settings storage operations
 */
const settingsStorage = {
    load() {
        return storage.get(STORAGE_KEYS.SETTINGS, {
            theme: 'dark',
            currency: 'USD'
        });
    },

    save(settings) {
        storage.set(STORAGE_KEYS.SETTINGS, settings);
    }
};

/**
 * Budget storage operations
 */
const budgetStorage = {
    load() {
        return storage.get(STORAGE_KEYS.BUDGETS, {});
    },

    save(budgets) {
        storage.set(STORAGE_KEYS.BUDGETS, budgets);
    }
};

export { 
    storage, 
    expenseStorage, 
    settingsStorage, 
    budgetStorage, 
    STORAGE_KEYS 
};

