/**
 * Charts Module - Data Visualization
 * 
 * Creates charts using Canvas API and CSS
 * Demonstrates: Canvas API, animation frames, data visualization
 */

import { formatCurrency, percentage } from './utils.js';

// ============================================
// Category Colors
// ============================================

const CATEGORY_COLORS = {
    food: { main: '#ff6b6b', light: 'rgba(255, 107, 107, 0.2)' },
    travel: { main: '#4ecdc4', light: 'rgba(78, 205, 196, 0.2)' },
    shopping: { main: '#a66cff', light: 'rgba(166, 108, 255, 0.2)' },
    bills: { main: '#ffd93d', light: 'rgba(255, 217, 61, 0.2)' },
    entertainment: { main: '#ff8fb1', light: 'rgba(255, 143, 177, 0.2)' },
    health: { main: '#6bcb77', light: 'rgba(107, 203, 119, 0.2)' },
    other: { main: '#8b98a5', light: 'rgba(139, 152, 165, 0.2)' }
};

// ============================================
// Donut Chart (Canvas)
// ============================================

/**
 * Create animated donut chart
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} data - Category totals object
 * @param {Object} options - Chart options
 */
export function createDonutChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        size = 200,
        lineWidth = 30,
        animationDuration = 800,
        showLabels = true
    } = options;

    // Set canvas size (handle retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - lineWidth) / 2;

    // Calculate total and angles
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
        drawEmptyState(ctx, centerX, centerY, radius, lineWidth);
        return;
    }

    // Prepare segments
    const segments = Object.entries(data)
        .filter(([_, value]) => value > 0)
        .map(([category, value]) => ({
            category,
            value,
            percentage: (value / total) * 100,
            angle: (value / total) * Math.PI * 2,
            color: CATEGORY_COLORS[category]?.main || '#8b98a5'
        }))
        .sort((a, b) => b.value - a.value);

    // Animation
    let progress = 0;
    const startTime = performance.now();

    function animate(currentTime) {
        progress = Math.min((currentTime - startTime) / animationDuration, 1);
        const easedProgress = easeOutCubic(progress);

        ctx.clearRect(0, 0, size, size);

        // Draw background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Draw segments
        let currentAngle = -Math.PI / 2; // Start from top

        segments.forEach(segment => {
            const segmentAngle = segment.angle * easedProgress;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
            ctx.strokeStyle = segment.color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'butt';
            ctx.stroke();

            currentAngle += segmentAngle;
        });

        // Draw center text
        if (showLabels && progress > 0.5) {
            const textOpacity = (progress - 0.5) * 2;
            ctx.fillStyle = `rgba(231, 233, 234, ${textOpacity})`;
            ctx.font = 'bold 24px "JetBrains Mono"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(formatCurrency(total * easedProgress), centerX, centerY - 8);

            ctx.fillStyle = `rgba(139, 152, 165, ${textOpacity})`;
            ctx.font = '12px "Outfit"';
            ctx.fillText('Total Spent', centerX, centerY + 16);
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

/**
 * Draw empty state for donut chart
 */
function drawEmptyState(ctx, centerX, centerY, radius, lineWidth) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.fillStyle = 'rgba(139, 152, 165, 0.5)';
    ctx.font = '14px "Outfit"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data', centerX, centerY);
}

// ============================================
// Bar Chart (Canvas)
// ============================================

/**
 * Create animated bar chart for spending over time
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} data - Array of {label, value} objects
 * @param {Object} options - Chart options
 */
export function createBarChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        width = 600,
        height = 300,
        barColor = '#00d4aa',
        animationDuration = 600,
        showValues = true,
        padding = { top: 40, right: 20, bottom: 60, left: 60 }
    } = options;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    if (!data.length) {
        drawEmptyBarChart(ctx, width, height);
        return;
    }

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data.map(d => d.value)) || 1;
    const barWidth = (chartWidth / data.length) * 0.6;
    const barGap = (chartWidth / data.length) * 0.4;

    // Animation
    let progress = 0;
    const startTime = performance.now();

    function animate(currentTime) {
        progress = Math.min((currentTime - startTime) / animationDuration, 1);
        const easedProgress = easeOutCubic(progress);

        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxValue - (maxValue / 5) * i;
            ctx.fillStyle = 'rgba(139, 152, 165, 0.8)';
            ctx.font = '11px "JetBrains Mono"';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`$${Math.round(value)}`, padding.left - 10, y);
        }

        // Draw bars
        data.forEach((item, index) => {
            const x = padding.left + (chartWidth / data.length) * index + barGap / 2;
            const barHeight = (item.value / maxValue) * chartHeight * easedProgress;
            const y = padding.top + chartHeight - barHeight;

            // Bar gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, barColor);
            gradient.addColorStop(1, 'rgba(0, 212, 170, 0.3)');

            // Draw bar
            ctx.fillStyle = gradient;
            roundRect(ctx, x, y, barWidth, barHeight, 4);
            ctx.fill();

            // X-axis labels
            ctx.fillStyle = 'rgba(139, 152, 165, 0.8)';
            ctx.font = '11px "Outfit"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(item.label, x + barWidth / 2, height - padding.bottom + 10);

            // Value labels
            if (showValues && progress > 0.7) {
                const labelOpacity = (progress - 0.7) / 0.3;
                ctx.fillStyle = `rgba(231, 233, 234, ${labelOpacity})`;
                ctx.font = 'bold 11px "JetBrains Mono"';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`$${Math.round(item.value * easedProgress)}`, x + barWidth / 2, y - 5);
            }
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

/**
 * Draw empty state for bar chart
 */
function drawEmptyBarChart(ctx, width, height) {
    ctx.fillStyle = 'rgba(139, 152, 165, 0.5)';
    ctx.font = '14px "Outfit"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No spending data to display', width / 2, height / 2);
}

// ============================================
// Line Chart (Canvas)
// ============================================

/**
 * Create animated line chart for trends
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} data - Array of {label, value} objects
 * @param {Object} options - Chart options
 */
export function createLineChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        width = 600,
        height = 250,
        lineColor = '#00d4aa',
        animationDuration = 1000,
        showPoints = true,
        showArea = true,
        padding = { top: 30, right: 20, bottom: 50, left: 60 }
    } = options;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    if (data.length < 2) {
        drawEmptyBarChart(ctx, width, height);
        return;
    }

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data.map(d => d.value)) * 1.1 || 1;
    const minValue = 0;

    // Calculate points
    const points = data.map((item, index) => ({
        x: padding.left + (chartWidth / (data.length - 1)) * index,
        y: padding.top + chartHeight - ((item.value - minValue) / (maxValue - minValue)) * chartHeight,
        value: item.value,
        label: item.label
    }));

    // Animation
    let progress = 0;
    const startTime = performance.now();

    function animate(currentTime) {
        progress = Math.min((currentTime - startTime) / animationDuration, 1);
        const easedProgress = easeOutCubic(progress);

        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        // Calculate visible points based on progress
        const visibleLength = Math.floor(points.length * easedProgress);
        const partialProgress = (points.length * easedProgress) % 1;

        // Draw area fill
        if (showArea && visibleLength > 0) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, padding.top + chartHeight);
            
            for (let i = 0; i < visibleLength; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            
            if (visibleLength < points.length && partialProgress > 0) {
                const nextPoint = points[visibleLength];
                const prevPoint = points[visibleLength - 1];
                const interpX = prevPoint.x + (nextPoint.x - prevPoint.x) * partialProgress;
                const interpY = prevPoint.y + (nextPoint.y - prevPoint.y) * partialProgress;
                ctx.lineTo(interpX, interpY);
                ctx.lineTo(interpX, padding.top + chartHeight);
            } else if (visibleLength > 0) {
                ctx.lineTo(points[visibleLength - 1].x, padding.top + chartHeight);
            }
            
            ctx.closePath();
            
            const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
            gradient.addColorStop(0, 'rgba(0, 212, 170, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 212, 170, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw line
        if (visibleLength > 0) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < visibleLength; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            
            if (visibleLength < points.length && partialProgress > 0) {
                const nextPoint = points[visibleLength];
                const prevPoint = points[visibleLength - 1];
                const interpX = prevPoint.x + (nextPoint.x - prevPoint.x) * partialProgress;
                const interpY = prevPoint.y + (nextPoint.y - prevPoint.y) * partialProgress;
                ctx.lineTo(interpX, interpY);
            }
            
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // Draw points
        if (showPoints) {
            for (let i = 0; i < visibleLength; i++) {
                const point = points[i];
                
                // Outer glow
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 212, 170, 0.2)';
                ctx.fill();
                
                // Point
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = lineColor;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#0f1419';
                ctx.fill();
            }
        }

        // X-axis labels
        ctx.fillStyle = 'rgba(139, 152, 165, 0.8)';
        ctx.font = '11px "Outfit"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        points.forEach((point, i) => {
            if (i % Math.ceil(points.length / 7) === 0 || i === points.length - 1) {
                ctx.fillText(point.label, point.x, height - padding.bottom + 10);
            }
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// ============================================
// CSS Progress Bars
// ============================================

/**
 * Create budget progress bar HTML
 * @param {string} category - Category name
 * @param {number} spent - Amount spent
 * @param {number} budget - Budget limit
 * @returns {string} HTML string
 */
export function createProgressBar(category, spent, budget) {
    const pct = Math.min(percentage(spent, budget), 100);
    const isOverBudget = spent > budget;
    const color = CATEGORY_COLORS[category]?.main || '#8b98a5';

    return `
        <div class="budget-progress" data-category="${category}">
            <div class="budget-progress-header">
                <span class="budget-category">${category}</span>
                <span class="budget-values">
                    <span class="budget-spent">${formatCurrency(spent)}</span>
                    <span class="budget-separator">/</span>
                    <span class="budget-limit">${formatCurrency(budget)}</span>
                </span>
            </div>
            <div class="budget-progress-track">
                <div 
                    class="budget-progress-fill ${isOverBudget ? 'over-budget' : ''}"
                    style="width: ${pct}%; background-color: ${isOverBudget ? 'var(--color-danger)' : color};"
                ></div>
            </div>
            <span class="budget-percentage ${isOverBudget ? 'over-budget' : ''}">${pct}%</span>
        </div>
    `;
}

/**
 * Create chart legend HTML
 * @param {Object} data - Category totals
 * @param {number} total - Total amount
 * @returns {string} HTML string
 */
export function createChartLegend(data, total) {
    const items = Object.entries(data)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([category, value]) => {
            const pct = percentage(value, total);
            const color = CATEGORY_COLORS[category]?.main || '#8b98a5';
            return `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${color}"></span>
                    <span class="legend-label">${category}</span>
                    <span class="legend-value">${formatCurrency(value)}</span>
                    <span class="legend-percentage">${pct}%</span>
                </div>
            `;
        });

    return `<div class="chart-legend">${items.join('')}</div>`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Draw rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Easing function for animations
 */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export { CATEGORY_COLORS };

