import confetti from 'canvas-confetti';
import { exportToICS, copyMarkdownAgenda } from '../utils/ics-exporter.js';
import { minutesToTimeStr } from '../agents/agent-pipeline.js';
import { escapeHtml } from '../utils/sanitize.js';

export class CalendarTimeline {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.schedule = options.schedule || [];
    this.currentView = 'daily'; // 'daily' | 'weekly'
    this.onScheduleChange = options.onScheduleChange || (() => {});
    this.onTaskCompleted = options.onTaskCompleted || (() => {});
  }

  setSchedule(schedule) {
    this.schedule = schedule;
    this.render();
  }

  render() {
    if (!this.container) return;

    const totalMinutes = this.schedule.reduce((acc, item) => acc + (item.duration || 0), 0);
    const deepWorkMinutes = this.schedule
      .filter(item => item.category === 'deep-work' || item.category === 'goal-chunk')
      .reduce((acc, item) => acc + (item.duration || 0), 0);
    const completedCount = this.schedule.filter(item => item.completed).length;
    const progressPercent = this.schedule.length > 0 
      ? Math.round((completedCount / this.schedule.length) * 100) 
      : 0;

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    let html = `
      <div class="glass-panel">
        <div class="timeline-header">
          <div class="timeline-date-info">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${todayStr}
            </h2>
            <p>Chronobiologically synchronized time-blocks</p>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="timeline-view-modes">
              <button class="view-btn ${this.currentView === 'daily' ? 'active' : ''}" id="btn-view-daily">Daily View</button>
              <button class="view-btn ${this.currentView === 'weekly' ? 'active' : ''}" id="btn-view-weekly">Weekly Grid</button>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-copy-agenda" title="Copy clean Markdown agenda for Slack/Notion">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              Copy Agenda
            </button>
            <button class="btn btn-primary btn-sm" id="btn-export-ics" title="Export .ics to Google Calendar / Apple Calendar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export .ICS
            </button>
          </div>
        </div>

        <!-- Schedule Summary Bar -->
        <div class="schedule-summary-bar">
          <div class="summary-metric-card">
            <span class="summary-metric-title">Planned Hours</span>
            <div class="summary-metric-val">
              ${(totalMinutes / 60).toFixed(1)} <span style="font-size: 0.8rem; font-weight: 500;">hrs</span>
            </div>
            <span class="summary-metric-sub">${this.schedule.length} scheduled blocks</span>
          </div>

          <div class="summary-metric-card">
            <span class="summary-metric-title">Deep Work Flow</span>
            <div class="summary-metric-val" style="color: var(--accent-indigo);">
              ${(deepWorkMinutes / 60).toFixed(1)} <span style="font-size: 0.8rem; font-weight: 500;">hrs</span>
            </div>
            <span class="summary-metric-sub">Peak cognitive alignment</span>
          </div>

          <div class="summary-metric-card">
            <span class="summary-metric-title">Task Completion</span>
            <div class="summary-metric-val">
              ${completedCount}/${this.schedule.length}
            </div>
            <span class="summary-metric-sub">${progressPercent}% throughput</span>
          </div>

          <div class="summary-metric-card">
            <span class="summary-metric-title">Daily Growth Pts</span>
            <div class="summary-metric-val" style="color: var(--accent-emerald);">
              +${completedCount * 10 + Math.floor(deepWorkMinutes / 2)}
            </div>
            <span class="summary-metric-sub">Adds to green matrix</span>
          </div>
        </div>

        <!-- Schedule Timeline List -->
        <div class="timeline-scroll-container" id="timeline-slots-list">
    `;

    if (this.schedule.length === 0) {
      html += `
        <div class="empty-schedule-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>No schedule active yet. Enter your tasks and meetings on the left or select a preset to unleash the agentic orchestrator!</p>
        </div>
      `;
    } else {
      this.schedule.forEach((item, index) => {
        const categoryClass = item.category || 'deep-work';
        const loadClass = (item.cognitiveLoad || 'medium').toLowerCase();

        html += `
          <div class="time-slot-row" data-index="${index}">
            <div class="time-slot-time">
              ${item.startTime}
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 400;">
                ${item.endTime}
              </div>
            </div>

            <div class="time-slot-card ${categoryClass} ${item.completed ? 'completed' : ''}" data-index="${index}">
              <div class="slot-main-content">
                <div class="slot-checkbox ${item.completed ? 'checked' : ''}" data-index="${index}" title="Mark completed">
                  ${item.completed ? `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ` : ''}
                </div>

                <div class="slot-info">
                  <div class="slot-title">
                    ${escapeHtml(item.title)}
                    ${item.isFixed ? `<span style="font-size: 0.65rem; color: var(--accent-amber); font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 4px; padding: 1px 5px;">FIXED</span>` : ''}
                  </div>
                  <div class="slot-meta">
                    <span class="category-tag">${escapeHtml(item.category.replace('-', ' '))}</span>
                    <span class="load-tag ${loadClass}">Load: ${escapeHtml(item.cognitiveLoad || 'Med')}</span>
                    <span>⏱ ${parseInt(item.duration, 10)}m</span>
                  </div>
                </div>
              </div>

              <div class="slot-actions">
                <button class="slot-action-btn shift-btn" data-index="${index}" title="Shift +30 minutes">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="13 17 18 12 13 7"></polyline>
                    <polyline points="6 17 11 12 6 7"></polyline>
                  </svg>
                </button>
                <button class="slot-action-btn delete-btn" data-index="${index}" title="Remove task">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    // Checkbox click
    const checkboxes = this.container.querySelectorAll('.slot-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(cb.getAttribute('data-index'), 10);
        const item = this.schedule[idx];
        if (item) {
          item.completed = !item.completed;
          if (item.completed) {
            // Trigger celebration confetti
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#10b981', '#34d399', '#6366f1', '#06b6d4']
            });
          }
          this.render();
          this.onTaskCompleted(item, this.schedule);
          this.onScheduleChange(this.schedule);
        }
      });
    });

    // Shift +30m button
    const shiftBtns = this.container.querySelectorAll('.shift-btn');
    shiftBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const item = this.schedule[idx];
        if (item) {
          item.startMinute += 30;
          item.endMinute += 30;
          item.startTime = minutesToTimeStr(item.startMinute);
          item.endTime = minutesToTimeStr(item.endMinute);
          this.schedule.sort((a, b) => a.startMinute - b.startMinute);
          this.render();
          this.onScheduleChange(this.schedule);
        }
      });
    });

    // Delete button
    const deleteBtns = this.container.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.schedule.splice(idx, 1);
        this.render();
        this.onScheduleChange(this.schedule);
      });
    });

    // Export .ICS
    const exportIcsBtn = this.container.querySelector('#btn-export-ics');
    if (exportIcsBtn) {
      exportIcsBtn.addEventListener('click', () => {
        exportToICS(this.schedule);
      });
    }

    // Copy Markdown Agenda
    const copyAgendaBtn = this.container.querySelector('#btn-copy-agenda');
    if (copyAgendaBtn) {
      copyAgendaBtn.addEventListener('click', () => {
        copyMarkdownAgenda(this.schedule);
        const originalText = copyAgendaBtn.innerHTML;
        copyAgendaBtn.innerHTML = `✅ Copied!`;
        setTimeout(() => {
          copyAgendaBtn.innerHTML = originalText;
        }, 2000);
      });
    }

    // View toggles
    const btnDaily = this.container.querySelector('#btn-view-daily');
    const btnWeekly = this.container.querySelector('#btn-view-weekly');
    if (btnDaily && btnWeekly) {
      btnDaily.addEventListener('click', () => {
        this.currentView = 'daily';
        btnDaily.classList.add('active');
        btnWeekly.classList.remove('active');
      });
      btnWeekly.addEventListener('click', () => {
        this.currentView = 'weekly';
        btnWeekly.classList.add('active');
        btnDaily.classList.remove('active');
        alert('Weekly projection view enabled: 7-day recurring blocks aligned to your chronotype.');
      });
    }
  }
}
