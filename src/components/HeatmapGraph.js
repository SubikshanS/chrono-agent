import { escapeHtml } from '../utils/sanitize.js';

export class HeatmapGraph {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.history = options.history || {};
    this.onSelectDate = options.onSelectDate || (() => {});
    this.tooltipEl = null;
    this.initTooltip();
  }

  initTooltip() {
    let tooltip = document.getElementById('heatmap-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'heatmap-tooltip';
      tooltip.className = 'heatmap-tooltip';
      document.body.appendChild(tooltip);
    }
    this.tooltipEl = tooltip;
  }

  updateHistory(newHistory) {
    this.history = newHistory;
    this.render();
  }

  render() {
    if (!this.container) return;

    // Calculate rolling 52 weeks (364 days) ending today
    const today = new Date();
    const daysToShow = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);

    // Group dates into 52 columns of 7 days
    const columns = [];
    let currentColumn = [];
    const monthHeaders = [];
    let lastMonth = -1;

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = this.history[dateStr] || { level: 0, count: 0, focusMinutes: 0, completedTasks: 0 };

      const dayOfWeek = d.getDay(); // 0 is Sunday
      currentColumn.push({
        date: d,
        dateStr,
        dayOfWeek,
        level: entry.level || 0,
        count: entry.count || 0,
        focusMinutes: entry.focusMinutes || 0,
        completedTasks: entry.completedTasks || 0
      });

      if (dayOfWeek === 6 || i === daysToShow - 1) {
        columns.push(currentColumn);
        // Check for month label at start of column
        const firstDayCol = currentColumn[0].date;
        if (firstDayCol.getMonth() !== lastMonth) {
          lastMonth = firstDayCol.getMonth();
          monthHeaders.push({
            name: firstDayCol.toLocaleString('default', { month: 'short' }),
            columnIndex: columns.length - 1
          });
        }
        currentColumn = [];
      }
    }

    // Render HTML structure
    let html = `
      <div class="heatmap-wrapper">
        <div class="heatmap-months-row">
          <span style="width: 28px;"></span>
          ${monthHeaders.map(m => `<span class="heatmap-month-label">${m.name}</span>`).join('')}
        </div>
        <div class="heatmap-grid-area">
          <div class="heatmap-days-legend">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div class="heatmap-matrix" id="heatmap-cells-grid">
    `;

    // Render 52 columns x 7 cells
    columns.forEach(col => {
      col.forEach(cell => {
        const isToday = cell.dateStr === today.toISOString().split('T')[0];
        const formattedDate = cell.date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        html += `
          <div 
            class="heatmap-cell level-${cell.level} ${isToday ? 'today-cell' : ''}" 
            data-date="${cell.dateStr}"
            data-formatted-date="${formattedDate}"
            data-tasks="${cell.completedTasks}"
            data-minutes="${cell.focusMinutes}"
            data-count="${cell.count}"
          ></div>
        `;
      });
    });

    html += `
          </div>
        </div>
        <div class="heatmap-footer">
          <span>Active Streak Matrix: Tracking daily deep focus and task throughput</span>
          <div class="heatmap-legend">
            <span>Less</span>
            <div class="legend-box level-0" style="background: var(--gh-level-0); border: 1px solid var(--gh-border)"></div>
            <div class="legend-box level-1" style="background: var(--gh-level-1);"></div>
            <div class="legend-box level-2" style="background: var(--gh-level-2);"></div>
            <div class="legend-box level-3" style="background: var(--gh-level-3);"></div>
            <div class="legend-box level-4" style="background: var(--gh-level-4);"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const cells = this.container.querySelectorAll('.heatmap-cell');

    cells.forEach(cell => {
      cell.addEventListener('mouseenter', (e) => {
        const dateStr = cell.getAttribute('data-formatted-date');
        const tasks = parseInt(cell.getAttribute('data-tasks') || '0', 10);
        const minutes = parseInt(cell.getAttribute('data-minutes') || '0', 10);
        const hours = Math.round((minutes / 60) * 10) / 10;

        let content = '';
        if (tasks === 0 && minutes === 0) {
          content = `<strong>No focus inputs</strong> on ${escapeHtml(dateStr)}`;
        } else {
          content = `
            <strong>${tasks} tasks completed (${hours}h focus)</strong><br>
            <span style="color: var(--accent-emerald);">● Growth Score: ${tasks * 10 + minutes} pts</span> on ${escapeHtml(dateStr)}
          `;
        }

        this.tooltipEl.innerHTML = content;
        this.tooltipEl.classList.add('visible');

        const rect = cell.getBoundingClientRect();
        this.tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
        this.tooltipEl.style.top = `${rect.top}px`;
      });

      cell.addEventListener('mouseleave', () => {
        this.tooltipEl.classList.remove('visible');
      });

      cell.addEventListener('click', () => {
        const rawDate = cell.getAttribute('data-date');
        this.onSelectDate(rawDate);
      });
    });
  }
}
