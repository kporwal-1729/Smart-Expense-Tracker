/**
 * Router Module - Client-Side SPA Navigation
 * 
 * Implements hash-based routing for single page app
 * Demonstrates: History API, event handling, dynamic rendering
 */

class Router {
    constructor() {
        this._routes = new Map();
        this._currentRoute = null;
        this._beforeHooks = [];
        this._afterHooks = [];
        this._notFoundHandler = null;
        
        // Bind methods
        this._handleRouteChange = this._handleRouteChange.bind(this);
    }

    /**
     * Initialize router and start listening
     */
    init() {
        window.addEventListener('hashchange', this._handleRouteChange);
        window.addEventListener('load', this._handleRouteChange);
        
        // Handle initial route
        this._handleRouteChange();
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., 'dashboard', 'analytics')
     * @param {Function} handler - Route handler function
     * @returns {Router} For chaining
     */
    on(path, handler) {
        this._routes.set(path, handler);
        return this;
    }

    /**
     * Set 404 handler
     * @param {Function} handler - Not found handler
     * @returns {Router} For chaining
     */
    notFound(handler) {
        this._notFoundHandler = handler;
        return this;
    }

    /**
     * Add before navigation hook
     * @param {Function} hook - Hook function (can return false to cancel)
     * @returns {Router} For chaining
     */
    beforeEach(hook) {
        this._beforeHooks.push(hook);
        return this;
    }

    /**
     * Add after navigation hook
     * @param {Function} hook - Hook function
     * @returns {Router} For chaining
     */
    afterEach(hook) {
        this._afterHooks.push(hook);
        return this;
    }

    /**
     * Navigate to a route programmatically
     * @param {string} path - Route path
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Get current route
     * @returns {string} Current route path
     */
    getCurrentRoute() {
        return this._currentRoute;
    }

    /**
     * Parse current hash and extract route info
     * @returns {Object} Route info with path and params
     * @private
     */
    _parseHash() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const [path, queryString] = hash.split('?');
        const params = {};

        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }

        return { path, params };
    }

    /**
     * Handle route change event
     * @private
     */
    async _handleRouteChange() {
        const { path, params } = this._parseHash();
        const previousRoute = this._currentRoute;

        // Run before hooks
        for (const hook of this._beforeHooks) {
            const result = await hook(path, previousRoute);
            if (result === false) return; // Cancel navigation
        }

        this._currentRoute = path;

        // Find and execute handler
        const handler = this._routes.get(path);
        
        if (handler) {
            await handler(params);
        } else if (this._notFoundHandler) {
            await this._notFoundHandler(path);
        }

        // Update active nav links
        this._updateNavLinks(path);

        // Run after hooks
        for (const hook of this._afterHooks) {
            await hook(path, previousRoute);
        }
    }

    /**
     * Update navigation link active states
     * @param {string} currentPath - Current route path
     * @private
     */
    _updateNavLinks(currentPath) {
        document.querySelectorAll('[data-route]').forEach(link => {
            const isActive = link.dataset.route === currentPath;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    /**
     * Destroy router and remove listeners
     */
    destroy() {
        window.removeEventListener('hashchange', this._handleRouteChange);
        window.removeEventListener('load', this._handleRouteChange);
    }
}

// Create singleton instance
const router = new Router();

export { Router, router };

