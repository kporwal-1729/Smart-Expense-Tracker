/**
 * Store Module - Centralized State Management
 * 
 * Implements a simple pub/sub pattern similar to Redux
 * Demonstrates: Observer pattern, ES6 classes, closures
 */

class Store {
    constructor(initialState = {}) {
        this._state = initialState;
        this._listeners = new Map();
        this._middlewares = [];
    }

    /**
     * Get current state (returns immutable copy)
     * @returns {Object} Current state
     */
    getState() {
        return JSON.parse(JSON.stringify(this._state));
    }

    /**
     * Update state and notify listeners
     * @param {string} key - State key to update
     * @param {*} value - New value
     */
    setState(key, value) {
        const oldValue = this._state[key];
        this._state[key] = value;

        // Run middlewares
        this._middlewares.forEach(middleware => {
            middleware({ key, oldValue, newValue: value, state: this._state });
        });

        // Notify listeners for this specific key
        if (this._listeners.has(key)) {
            this._listeners.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }

        // Notify global listeners
        if (this._listeners.has('*')) {
            this._listeners.get('*').forEach(callback => {
                callback(this._state, key);
            });
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch ('*' for all)
     * @param {Function} callback - Function to call on change
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Set());
        }
        this._listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this._listeners.get(key).delete(callback);
        };
    }

    /**
     * Add middleware for state changes
     * @param {Function} middleware - Middleware function
     */
    use(middleware) {
        this._middlewares.push(middleware);
    }

    /**
     * Batch multiple state updates
     * @param {Object} updates - Object with key-value pairs to update
     */
    batchUpdate(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this._state[key] = value;
        });

        // Notify all listeners once
        if (this._listeners.has('*')) {
            this._listeners.get('*').forEach(callback => {
                callback(this._state, Object.keys(updates));
            });
        }
    }
}

// Create singleton instance with initial state
const store = new Store({
    expenses: [],
    filters: {
        category: 'all',
        dateRange: 'all',
        searchQuery: ''
    },
    settings: {
        theme: 'dark',
        currency: 'USD',
        budgets: {}
    },
    currentView: 'dashboard',
    isLoading: false
});

// Logging middleware for development
store.use(({ key, oldValue, newValue }) => {
    if (window.DEBUG_MODE) {
        console.log(`[Store] ${key}:`, { oldValue, newValue });
    }
});

export { Store, store };

