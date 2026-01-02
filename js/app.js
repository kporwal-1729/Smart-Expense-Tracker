/**
 * ExpenseFlow - Main Application Entry Point
 * 
 * Single Page Application with modular architecture
 * Demonstrates: ES6 modules, SPA routing, event-driven architecture
 * 
 * @author ExpenseFlow
 * @version 2.0.0
 */

// ============================================
// Module Imports
// ============================================

import { store } from './modules/store.js';
import { router } from './modules/router.js';
import { expenseStorage, settingsStorage, budgetStorage } from './modules/storage.js';
import { 
    generateId, 
    formatCurrency, 
    formatDate, 
    getDateRange, 
    sortBy, 
    groupBy,
    groupByPeriod,
    debounce,
    calculateStats
} from './modules/utils.js';
import {
    CATEGORIES,
    ExpenseList,
    ExpenseItem,
    TotalCard,
    CategoryBreakdown,
    FilterBar,
    BudgetOverview,
    BudgetForm,
    EmptyState,
    Navigation,
    StatsCard,
    Toast
} from './modules/components.js';
import { 
    createDonutChart, 
    createBarChart, 
    createLineChart,
    createChartLegend,
    CATEGORY_COLORS
} from './modules/charts.js';

// ============================================
// DOM References
// ============================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ============================================
// Application Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Load persisted data
    loadPersistedData();
    
    // Setup router
    setupRouter();
    
    // Setup global event listeners
    setupGlobalListeners();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Apply saved theme
    applyTheme(store.getState().settings.theme);
    
    // Initialize router
    router.init();
}

/**
 * Load data from storage into state
 */
function loadPersistedData() {
    const expenses = expenseStorage.load();
    const settings = settingsStorage.load();
    const budgets = budgetStorage.load();
    
    store.batchUpdate({
        expenses,
        settings: { ...store.getState().settings, ...settings, budgets }
    });
}

// ============================================
// Router Setup
// ============================================

/**
 * Configure application routes
 */
function setupRouter() {
    router
        .on('dashboard', renderDashboard)
        .on('analytics', renderAnalytics)
        .on('settings', renderSettings)
        .notFound(() => router.navigate('dashboard'))
        .beforeEach((to, from) => {
            // Add page transition class
            const main = $('#main-content');
            if (main) {
                main.classList.add('page-exit');
            }
            return true;
        })
        .afterEach((to, from) => {
            // Update store
            store.setState('currentView', to);
            
            // Remove transition class
            setTimeout(() => {
                const main = $('#main-content');
                if (main) {
                    main.classList.remove('page-exit');
                    main.classList.add('page-enter');
                    setTimeout(() => main.classList.remove('page-enter'), 300);
                }
            }, 50);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
}

// ============================================
// View Renderers
// ============================================

/**
 * Render Dashboard View
 */
function renderDashboard() {
    const state = store.getState();
    const { expenses, settings } = state;
    
    const filteredExpenses = applyFilters(expenses, state.filters);
    const stats = calculateExpenseStats(expenses);
    const categoryTotals = calculateCategoryTotals(expenses);
    
    const html = `
        <section class="dashboard-view">
            ${Navigation('dashboard')}
            
            <!-- Add Expense Section -->
            <section class="card add-expense-section" aria-labelledby="add-expense-heading">
                <h2 id="add-expense-heading" class="section-title">
                    <span class="title-icon">➕</span>
                    Add New Expense
                </h2>
                ${renderExpenseForm()}
            </section>
            
            <!-- Summary Section -->
            <section class="summary-section" aria-labelledby="summary-heading">
                <h2 id="summary-heading" class="section-title">
                    <span class="title-icon">📊</span>
                    Summary
                </h2>
                <div class="summary-grid">
                    ${TotalCard(stats.total, stats.count)}
                    ${CategoryBreakdown(categoryTotals, stats.total)}
                </div>
                
                <!-- Budget Progress -->
                ${settings.budgets && Object.keys(settings.budgets).length > 0 ? `
                    <div class="budget-section">
                        <h3 class="subsection-title">Budget Status</h3>
                        ${BudgetOverview(settings.budgets, categoryTotals)}
                    </div>
                ` : ''}
            </section>
            
            <!-- Expenses List Section -->
            <section class="expenses-section" aria-labelledby="expenses-heading">
                <div class="section-header">
                    <h2 id="expenses-heading" class="section-title">
                        <span class="title-icon">📋</span>
                        Recent Expenses
                    </h2>
                    <div class="section-actions">
                        <button id="export-btn" class="btn btn-secondary btn-small" aria-label="Export expenses">
                            📥 Export
                        </button>
                        <button id="clear-all-btn" class="btn btn-danger btn-small" aria-label="Clear all expenses" ${!expenses.length ? 'disabled' : ''}>
                            Clear All
                        </button>
                    </div>
                </div>
                
                ${FilterBar(state.filters)}
                
                <div id="expenses-container">
                    ${ExpenseList(filteredExpenses)}
                </div>
            </section>
        </section>
    `;
    
    $('#main-content').innerHTML = html;
    
    // Setup view-specific event listeners
    setupDashboardListeners();
}

/**
 * Render Analytics View
 */
function renderAnalytics() {
    const state = store.getState();
    const { expenses } = state;
    
    const stats = calculateExpenseStats(expenses);
    const categoryTotals = calculateCategoryTotals(expenses);
    const monthlyData = getMonthlySpending(expenses);
    const weeklyData = getWeeklySpending(expenses);
    
    // Calculate trends
    const thisMonth = getMonthSpending(expenses, 0);
    const lastMonth = getMonthSpending(expenses, 1);
    const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
    
    const html = `
        <section class="analytics-view">
            ${Navigation('analytics')}
            
            <h1 class="page-title">Spending Analytics</h1>
            
            <!-- Stats Overview -->
            <section class="stats-overview">
                ${StatsCard({ label: 'Total Spent', value: formatCurrency(stats.total), icon: '💰' })}
                ${StatsCard({ label: 'This Month', value: formatCurrency(thisMonth), change: monthChange, icon: '📅' })}
                ${StatsCard({ label: 'Average/Expense', value: formatCurrency(stats.avg), icon: '📊' })}
                ${StatsCard({ label: 'Total Transactions', value: stats.count, icon: '🧾' })}
            </section>
            
            <!-- Charts Section -->
            <div class="charts-grid">
                <!-- Category Distribution -->
                <section class="card chart-card">
                    <h2 class="chart-title">Spending by Category</h2>
                    <div class="chart-container donut-chart-container">
                        <canvas id="category-chart"></canvas>
                    </div>
                    <div id="category-legend" class="chart-legend-container">
                        ${createChartLegend(categoryTotals, stats.total)}
                    </div>
                </section>
                
                <!-- Monthly Spending -->
                <section class="card chart-card">
                    <h2 class="chart-title">Monthly Spending</h2>
                    <div class="chart-container bar-chart-container">
                        <canvas id="monthly-chart"></canvas>
                    </div>
                </section>
                
                <!-- Spending Trend -->
                <section class="card chart-card chart-card-wide">
                    <h2 class="chart-title">Spending Trend (Last 30 Days)</h2>
                    <div class="chart-container line-chart-container">
                        <canvas id="trend-chart"></canvas>
                    </div>
                </section>
            </div>
            
            <!-- Top Expenses -->
            <section class="card">
                <h2 class="section-title">Top Expenses</h2>
                <div class="top-expenses">
                    ${renderTopExpenses(expenses, 5)}
                </div>
            </section>
        </section>
    `;
    
    $('#main-content').innerHTML = html;
    
    // Render charts after DOM is ready
    requestAnimationFrame(() => {
        const categoryCanvas = $('#category-chart');
        const monthlyCanvas = $('#monthly-chart');
        const trendCanvas = $('#trend-chart');
        
        if (categoryCanvas) {
            createDonutChart(categoryCanvas, categoryTotals, { size: 220 });
        }
        if (monthlyCanvas) {
            createBarChart(monthlyCanvas, monthlyData, { 
                width: monthlyCanvas.parentElement.offsetWidth - 40,
                height: 280 
            });
        }
        if (trendCanvas) {
            createLineChart(trendCanvas, weeklyData, { 
                width: trendCanvas.parentElement.offsetWidth - 40,
                height: 250 
            });
        }
    });
}

/**
 * Render Settings View
 */
function renderSettings() {
    const state = store.getState();
    const { settings } = state;
    
    const html = `
        <section class="settings-view">
            ${Navigation('settings')}
            
            <h1 class="page-title">Settings</h1>
            
            <!-- Theme Settings -->
            <section class="card settings-card">
                <h2 class="settings-title">🎨 Appearance</h2>
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Theme</span>
                        <span class="setting-description">Choose your preferred color scheme</span>
                    </div>
                    <div class="theme-toggle">
                        <button 
                            class="theme-btn ${settings.theme === 'dark' ? 'active' : ''}" 
                            data-theme="dark"
                            aria-pressed="${settings.theme === 'dark'}"
                        >
                            🌙 Dark
                        </button>
                        <button 
                            class="theme-btn ${settings.theme === 'light' ? 'active' : ''}" 
                            data-theme="light"
                            aria-pressed="${settings.theme === 'light'}"
                        >
                            ☀️ Light
                        </button>
                    </div>
                </div>
            </section>
            
            <!-- Budget Settings -->
            <section class="card settings-card">
                <h2 class="settings-title">💰 Budget Limits</h2>
                <p class="settings-description">Set monthly spending limits for each category to track your budget.</p>
                ${BudgetForm(settings.budgets)}
            </section>
            
            <!-- Data Management -->
            <section class="card settings-card">
                <h2 class="settings-title">📦 Data Management</h2>
                <div class="data-actions">
                    <div class="action-row">
                        <div class="action-info">
                            <span class="action-label">Export Data</span>
                            <span class="action-description">Download your expenses as CSV or JSON</span>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" id="export-csv-btn">CSV</button>
                            <button class="btn btn-secondary" id="export-json-btn">JSON</button>
                        </div>
                    </div>
                    <div class="action-row danger-zone">
                        <div class="action-info">
                            <span class="action-label">Clear All Data</span>
                            <span class="action-description">Permanently delete all expenses and settings</span>
                        </div>
                        <button class="btn btn-danger" id="clear-data-btn">Delete All</button>
                    </div>
                </div>
            </section>
            
            <!-- Keyboard Shortcuts -->
            <section class="card settings-card">
                <h2 class="settings-title">⌨️ Keyboard Shortcuts</h2>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <kbd>N</kbd>
                        <span>Focus new expense form</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>D</kbd>
                        <span>Go to Dashboard</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>A</kbd>
                        <span>Go to Analytics</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>S</kbd>
                        <span>Go to Settings</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>/</kbd>
                        <span>Focus search</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Clear filters / Close modal</span>
                    </div>
                </div>
            </section>
            
            <!-- Storage Info -->
            <section class="card settings-card">
                <h2 class="settings-title">💾 Storage</h2>
                <div class="storage-info-detailed">
                    ${renderStorageInfo()}
                </div>
            </section>
        </section>
    `;
    
    $('#main-content').innerHTML = html;
    
    // Setup settings listeners
    setupSettingsListeners();
}

// ============================================
// Helper Renderers
// ============================================

/**
 * Render expense form HTML
 */
function renderExpenseForm() {
    const today = new Date().toISOString().split('T')[0];
    
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
                            <option value="${key}">${icon} ${name}</option>
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
                    >
                </div>
                
                <div class="form-group">
                    <label for="date">Date</label>
                    <input 
                        type="date" 
                        id="date" 
                        name="date"
                        value="${today}"
                        max="${today}"
                    >
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary" id="submit-btn">
                <span class="btn-text">Add Expense</span>
                <span class="btn-icon">→</span>
            </button>
            
            <div id="success-message" class="success-message" role="status" aria-live="polite">
                ✓ Expense added successfully!
            </div>
        </form>
    `;
}

/**
 * Render top expenses list
 */
function renderTopExpenses(expenses, limit = 5) {
    const sorted = sortBy(expenses, 'amount', 'desc').slice(0, limit);
    
    if (!sorted.length) {
        return '<p class="text-muted">No expenses to display</p>';
    }
    
    return `
        <ul class="top-expenses-list">
            ${sorted.map((exp, i) => `
                <li class="top-expense-item">
                    <span class="rank">#${i + 1}</span>
                    <span class="category-icon">${CATEGORIES[exp.category]?.icon || '📦'}</span>
                    <span class="description">${exp.description}</span>
                    <span class="amount">${formatCurrency(exp.amount)}</span>
                    <span class="date">${formatDate(exp.date, 'short')}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Render storage info
 */
function renderStorageInfo() {
    const state = store.getState();
    const count = state.expenses.length;
    const estimatedSize = JSON.stringify(state.expenses).length;
    const sizeKB = (estimatedSize / 1024).toFixed(2);
    
    return `
        <div class="storage-stat">
            <span class="storage-label">Expenses stored</span>
            <span class="storage-value">${count}</span>
        </div>
        <div class="storage-stat">
            <span class="storage-label">Storage used</span>
            <span class="storage-value">${sizeKB} KB</span>
        </div>
        <div class="storage-stat">
            <span class="storage-label">Storage available</span>
            <span class="storage-value">~5 MB</span>
        </div>
    `;
}

// ============================================
// Event Listeners
// ============================================

/**
 * Setup global event listeners
 */
function setupGlobalListeners() {
    // Toast container
    if (!$('#toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Handle toast dismissal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toast-close')) {
            e.target.closest('.toast').remove();
        }
    });
}

/**
 * Setup dashboard-specific listeners
 */
function setupDashboardListeners() {
    // Form submission
    const form = $('#expense-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Filter changes
    const searchInput = $('#filter-search');
    const categoryFilter = $('#filter-category');
    const dateFilter = $('#filter-date');
    const sortFilter = $('#filter-sort');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleFilterChange, 300));
    }
    [categoryFilter, dateFilter, sortFilter].forEach(el => {
        if (el) el.addEventListener('change', handleFilterChange);
    });
    
    // Expense list actions (delete)
    const expenseContainer = $('#expenses-container');
    if (expenseContainer) {
        expenseContainer.addEventListener('click', handleExpenseAction);
    }
    
    // Export button
    const exportBtn = $('#export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportData('csv'));
    }
    
    // Clear all button
    const clearAllBtn = $('#clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', handleClearAll);
    }
    
    // Input validation
    const amountInput = $('#amount');
    const categorySelect = $('#category');
    if (amountInput) {
        amountInput.addEventListener('input', () => clearError('amount'));
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', () => clearError('category'));
    }
}

/**
 * Setup settings-specific listeners
 */
function setupSettingsListeners() {
    // Theme toggle
    $$('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            updateTheme(theme);
        });
    });
    
    // Budget form
    const budgetForm = $('#budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetSubmit);
    }
    
    // Export buttons
    $('#export-csv-btn')?.addEventListener('click', () => exportData('csv'));
    $('#export-json-btn')?.addEventListener('click', () => exportData('json'));
    
    // Clear data
    $('#clear-data-btn')?.addEventListener('click', handleClearAllData);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case 'n':
                e.preventDefault();
                router.navigate('dashboard');
                setTimeout(() => $('#amount')?.focus(), 100);
                break;
            case 'd':
                e.preventDefault();
                router.navigate('dashboard');
                break;
            case 'a':
                e.preventDefault();
                router.navigate('analytics');
                break;
            case 's':
                e.preventDefault();
                router.navigate('settings');
                break;
            case '/':
                e.preventDefault();
                $('#filter-search')?.focus();
                break;
            case 'escape':
                clearFilters();
                break;
        }
    });
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle expense form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const amount = $('#amount').value.trim();
    const category = $('#category').value;
    const description = $('#description').value.trim();
    const date = $('#date').value;
    
    // Validate
    let isValid = true;
    
    if (!amount || parseFloat(amount) <= 0) {
        showError('amount', 'Please enter a valid amount');
        isValid = false;
    }
    
    if (!category) {
        showError('category', 'Please select a category');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Create expense
    const expense = {
        id: generateId(),
        amount: parseFloat(amount),
        category,
        description: description || CATEGORIES[category].name,
        date: new Date(date || Date.now()).toISOString()
    };
    
    // Add to state
    const expenses = [expense, ...store.getState().expenses];
    store.setState('expenses', expenses);
    expenseStorage.save(expenses);
    
    // Show success
    showSuccessMessage();
    
    // Reset form
    e.target.reset();
    $('#date').value = new Date().toISOString().split('T')[0];
    $('#amount').focus();
    
    // Check budget warning
    checkBudgetWarning(category);
    
    // Update UI
    updateExpensesList();
    updateSummary();
}

/**
 * Handle expense action (delete)
 */
function handleExpenseAction(e) {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    
    if (deleteBtn) {
        const expenseId = deleteBtn.dataset.id;
        const expenseItem = deleteBtn.closest('.expense-item');
        
        // Animate removal
        expenseItem.classList.add('removing');
        
        setTimeout(() => {
            const expenses = store.getState().expenses.filter(exp => exp.id !== expenseId);
            store.setState('expenses', expenses);
            expenseStorage.save(expenses);
            
            updateExpensesList();
            updateSummary();
        }, 300);
    }
}

/**
 * Handle filter change
 */
function handleFilterChange() {
    const filters = {
        searchQuery: $('#filter-search')?.value || '',
        category: $('#filter-category')?.value || 'all',
        dateRange: $('#filter-date')?.value || 'all',
        sortBy: $('#filter-sort')?.value || 'date-desc'
    };
    
    store.setState('filters', filters);
    updateExpensesList();
}

/**
 * Handle budget form submission
 */
function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const budgets = {};
    Object.keys(CATEGORIES).forEach(key => {
        const input = $(`#budget-${key}`);
        if (input && input.value) {
            budgets[key] = parseFloat(input.value);
        }
    });
    
    const settings = { ...store.getState().settings, budgets };
    store.setState('settings', settings);
    settingsStorage.save(settings);
    budgetStorage.save(budgets);
    
    showToast('Budgets saved successfully!', 'success');
}

/**
 * Handle clear all expenses
 */
function handleClearAll() {
    if (!confirm('Are you sure you want to delete all expenses? This cannot be undone.')) {
        return;
    }
    
    store.setState('expenses', []);
    expenseStorage.save([]);
    
    showToast('All expenses cleared', 'success');
    renderDashboard();
}

/**
 * Handle clear all data
 */
function handleClearAllData() {
    if (!confirm('This will permanently delete ALL your data including expenses, budgets, and settings. Continue?')) {
        return;
    }
    
    localStorage.clear();
    store.batchUpdate({
        expenses: [],
        settings: { theme: 'dark', currency: 'USD', budgets: {} },
        filters: { category: 'all', dateRange: 'all', searchQuery: '' }
    });
    
    showToast('All data cleared', 'success');
    router.navigate('dashboard');
}

// ============================================
// UI Updates
// ============================================

/**
 * Update expenses list without full re-render
 */
function updateExpensesList() {
    const container = $('#expenses-container');
    if (!container) return;
    
    const state = store.getState();
    const filtered = applyFilters(state.expenses, state.filters);
    
    container.innerHTML = ExpenseList(filtered);
}

/**
 * Update summary section
 */
function updateSummary() {
    const state = store.getState();
    const stats = calculateExpenseStats(state.expenses);
    const categoryTotals = calculateCategoryTotals(state.expenses);
    
    const totalCard = $('.total-card');
    if (totalCard) {
        totalCard.querySelector('.card-value').textContent = formatCurrency(stats.total);
        totalCard.querySelector('.card-count').textContent = `${stats.count} expense${stats.count !== 1 ? 's' : ''}`;
    }
    
    const breakdown = $('.category-breakdown');
    if (breakdown) {
        breakdown.outerHTML = CategoryBreakdown(categoryTotals, stats.total);
    }
}

// ============================================
// Theme Management
// ============================================

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Update theme and persist
 */
function updateTheme(theme) {
    applyTheme(theme);
    
    const settings = { ...store.getState().settings, theme };
    store.setState('settings', settings);
    settingsStorage.save(settings);
    
    // Update UI
    $$('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
        btn.setAttribute('aria-pressed', btn.dataset.theme === theme);
    });
    
    showToast(`Theme changed to ${theme}`, 'success');
}

// ============================================
// Data Calculations
// ============================================

/**
 * Apply filters to expenses
 */
function applyFilters(expenses, filters) {
    let result = [...expenses];
    
    // Search filter
    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        result = result.filter(exp => 
            exp.description.toLowerCase().includes(query) ||
            exp.category.toLowerCase().includes(query)
        );
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
        result = result.filter(exp => exp.category === filters.category);
    }
    
    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
        const { start, end } = getDateRange(filters.dateRange);
        result = result.filter(exp => {
            const date = new Date(exp.date);
            return date >= start && date <= end;
        });
    }
    
    // Sort
    if (filters.sortBy) {
        const [prop, order] = filters.sortBy.split('-');
        result = sortBy(result, prop, order);
    }
    
    return result;
}

/**
 * Calculate expense statistics
 */
function calculateExpenseStats(expenses) {
    const amounts = expenses.map(e => e.amount);
    const stats = calculateStats(amounts);
    return {
        total: stats.sum,
        avg: stats.avg,
        min: stats.min,
        max: stats.max,
        count: stats.count
    };
}

/**
 * Calculate totals by category
 */
function calculateCategoryTotals(expenses) {
    const totals = {};
    Object.keys(CATEGORIES).forEach(cat => totals[cat] = 0);
    
    expenses.forEach(exp => {
        if (totals.hasOwnProperty(exp.category)) {
            totals[exp.category] += exp.amount;
        }
    });
    
    return totals;
}

/**
 * Get monthly spending data for charts
 */
function getMonthlySpending(expenses) {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('en-US', { month: 'short' });
        
        const total = expenses
            .filter(exp => exp.date.startsWith(monthKey))
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        months.push({ label, value: total });
    }
    
    return months;
}

/**
 * Get weekly spending data
 */
function getWeeklySpending(expenses) {
    const days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const total = expenses
            .filter(exp => exp.date.startsWith(dateKey))
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        days.push({ label, value: total });
    }
    
    return days;
}

/**
 * Get spending for a specific month
 */
function getMonthSpending(expenses, monthsAgo = 0) {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const monthKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;
    
    return expenses
        .filter(exp => exp.date.startsWith(monthKey))
        .reduce((sum, exp) => sum + exp.amount, 0);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Show form error
 */
function showError(field, message) {
    const input = $(`#${field}`);
    const error = $(`#${field}-error`);
    
    if (input) input.classList.add('error');
    if (error) {
        error.textContent = message;
        error.classList.add('visible');
    }
}

/**
 * Clear form error
 */
function clearError(field) {
    const input = $(`#${field}`);
    const error = $(`#${field}-error`);
    
    if (input) input.classList.remove('error');
    if (error) {
        error.textContent = '';
        error.classList.remove('visible');
    }
}

/**
 * Show success message
 */
function showSuccessMessage() {
    const msg = $('#success-message');
    if (msg) {
        msg.classList.add('visible');
        setTimeout(() => msg.classList.remove('visible'), 2000);
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    store.setState('filters', {
        category: 'all',
        dateRange: 'all',
        searchQuery: '',
        sortBy: 'date-desc'
    });
    
    const searchInput = $('#filter-search');
    const categoryFilter = $('#filter-category');
    const dateFilter = $('#filter-date');
    const sortFilter = $('#filter-sort');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (dateFilter) dateFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'date-desc';
    
    updateExpensesList();
}

/**
 * Check and show budget warning
 */
function checkBudgetWarning(category) {
    const state = store.getState();
    const budget = state.settings.budgets?.[category];
    
    if (!budget) return;
    
    const spent = state.expenses
        .filter(exp => exp.category === category)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    if (spent >= budget) {
        showToast(`⚠️ You've exceeded your ${category} budget!`, 'warning');
    } else if (spent >= budget * 0.8) {
        showToast(`You're at ${Math.round((spent / budget) * 100)}% of your ${category} budget`, 'info');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const container = $('#toast-container');
    if (!container) return;
    
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => toast.classList.add('visible'));
    
    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Export data to file
 */
function exportData(format = 'csv') {
    const expenses = store.getState().expenses;
    
    if (!expenses.length) {
        showToast('No expenses to export', 'warning');
        return;
    }
    
    let content, filename, mimeType;
    
    if (format === 'csv') {
        const headers = ['Date', 'Category', 'Description', 'Amount'];
        const rows = expenses.map(exp => [
            formatDate(exp.date, 'iso'),
            exp.category,
            `"${exp.description.replace(/"/g, '""')}"`,
            exp.amount.toFixed(2)
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename = `expenses_${formatDate(new Date(), 'iso')}.csv`;
        mimeType = 'text/csv';
    } else {
        content = JSON.stringify(expenses, null, 2);
        filename = `expenses_${formatDate(new Date(), 'iso')}.json`;
        mimeType = 'application/json';
    }
    
    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${expenses.length} expenses`, 'success');
}

// ============================================
// Debug Utilities
// ============================================

window.expenseFlowDebug = {
    getState: () => store.getState(),
    getStore: () => store,
    addSampleData: () => {
        const samples = [
            { amount: 45.99, category: 'food', description: 'Groceries' },
            { amount: 120.00, category: 'bills', description: 'Electric bill' },
            { amount: 35.50, category: 'entertainment', description: 'Movie tickets' },
            { amount: 250.00, category: 'travel', description: 'Flight booking' },
            { amount: 89.99, category: 'shopping', description: 'New headphones' },
            { amount: 50.00, category: 'health', description: 'Pharmacy' },
            { amount: 25.00, category: 'food', description: 'Lunch' },
            { amount: 15.00, category: 'entertainment', description: 'Streaming' }
        ];
        
        const newExpenses = samples.map((exp, i) => ({
            id: generateId(),
            ...exp,
            date: new Date(Date.now() - i * 86400000).toISOString()
        }));
        
        const expenses = [...newExpenses, ...store.getState().expenses];
        store.setState('expenses', expenses);
        expenseStorage.save(expenses);
        renderDashboard();
        console.log('Sample data added');
    },
    clearStorage: () => {
        localStorage.clear();
        location.reload();
    }
};
