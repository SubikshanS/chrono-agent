import './styles/app.css';
import { runAgenticPipeline, GrowthAgent } from './agents/agent-pipeline.js';
import { CalendarTimeline } from './components/CalendarTimeline.js';
import { HeatmapGraph } from './components/HeatmapGraph.js';
import { AgentReasoningView } from './components/AgentReasoningView.js';
import {
  getStoredConfig,
  saveStoredConfig,
  getStoredSchedule,
  saveStoredSchedule,
  getStoredHistory,
  saveStoredHistory
} from './utils/storage.js';

// Realistic sample presets
const PRESETS = {
  founder: {
    name: '🚀 Startup Founder Sprint',
    prompt: `I have an investor pitch sync at 11:00 am for 45 minutes. Need 2.5 hours of uninterrupted deep coding for the checkout payment refactor. Want to synthesize user interview notes for 45 mins, 30m gym session, and zero out inbox by 6:30 pm.`
  },
  student: {
    name: '🎓 Exam Prep & Mastery',
    prompt: `I have a physics lab presentation at 2:00 pm for 1 hour. Goal: Prepare for machine learning exam - master backpropagation math, attention mechanisms, and practice sample problems for 3 hours. Need 30m run and wind down by 11:00 pm.`
  },
  executive: {
    name: '💼 Executive & Leadership',
    prompt: `Leadership sync at 9:30 am for 1 hour. Client review call at 3:30 pm for 45 mins. Need 2 hours to finalize Q4 budget allocation, 30 mins for 1-on-1 prep, and 20 mins mindfulness break.`
  },
  creative: {
    name: '🎨 Deep Creative Flow',
    prompt: `Podcast recording at 1:30 pm for 1 hour. Goal: Write and edit long-form architectural essay for 2.5 hours. Review subscriber feedback, design presentation deck, and take 45m scenic walk.`
  }
};

class ChronoFlowApp {
  constructor() {
    this.config = getStoredConfig();
    this.schedule = getStoredSchedule() || [];
    this.history = getStoredHistory();
    this.todayStr = new Date().toISOString().split('T')[0];

    this.timelineComponent = null;
    this.heatmapComponent = null;
    this.reasoningComponent = null;

    this.initDOM();
    this.initComponents();
    this.attachEventListeners();

    // If no schedule exists yet, load the default founder preset automatically
    if (this.schedule.length === 0) {
      this.loadPreset('founder');
    }
  }

  initDOM() {
    const appEl = document.getElementById('app');
    const metrics = GrowthAgent.calculateMetrics(this.history);

    appEl.innerHTML = `
      <div class="ambient-glow-1"></div>
      <div class="ambient-glow-2"></div>

      <!-- App Header -->
      <header class="app-header">
        <div class="brand-wrapper">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <h1 class="brand-title">
              ChronoFlow AI
              <span class="brand-badge">Agentic 2.0</span>
            </h1>
            <p class="brand-tagline">Autonomous Time Architect & Daily Growth Matrix</p>
          </div>
        </div>

        <div class="header-actions">
          <div class="stat-pill streak-pill" id="header-streak-pill" title="Daily habit & focus consistency streak">
            <span class="fire-icon">🔥</span>
            <span><strong>${metrics.currentStreak}</strong> Day Streak</span>
          </div>

          <div class="stat-pill growth-pill" id="header-focus-pill" title="Total focus hours logged in contribution matrix">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span><strong>${metrics.totalFocusHours}</strong> Focus Hrs</span>
          </div>

          <button class="btn btn-secondary btn-sm" id="btn-reset-day" title="Clear current schedule and reset">
            Reset
          </button>
        </div>
      </header>

      <!-- Main Columns Grid -->
      <main class="main-grid">
        <!-- Left: Intake & Agent Deliberation -->
        <aside class="left-column">
          <!-- Intake Panel -->
          <section class="glass-panel">
            <div class="panel-header">
              <div class="panel-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Context & Input Stream
              </div>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Natural Language Intake</span>
            </div>

            <textarea 
              id="intake-input-text" 
              class="intake-prompt-box" 
              placeholder="Tell ChronoFlow about your day... e.g.: 'Meeting with team at 10am for 45m. Need 2 hours for deep code refactor. Want 30m gym session and study ML course. Wake up at 7am, sleep by 11pm.'"
            ></textarea>

            <!-- Presets -->
            <div class="presets-section">
              <div class="presets-label">Quick Scenario Presets</div>
              <div class="presets-container">
                <button class="preset-chip" data-preset="founder">🚀 Founder Sprint</button>
                <button class="preset-chip" data-preset="student">🎓 Exam Mastery</button>
                <button class="preset-chip" data-preset="executive">💼 Exec & Strategy</button>
                <button class="preset-chip" data-preset="creative">🎨 Creative Flow</button>
              </div>
            </div>

            <!-- Parameters (Chronotype & Wake/Sleep) -->
            <div class="params-grid">
              <div class="param-item">
                <label for="param-chronotype">Chronobiology Profile</label>
                <select id="param-chronotype" class="param-select">
                  <option value="morning-lark" ${this.config.chronotype === 'morning-lark' ? 'selected' : ''}>🌅 Morning Lark (Early Peak)</option>
                  <option value="third-bird" ${this.config.chronotype === 'third-bird' ? 'selected' : ''}>⚖️ Third Bird (Balanced)</option>
                  <option value="night-owl" ${this.config.chronotype === 'night-owl' ? 'selected' : ''}>🦉 Night Owl (Evening Focus)</option>
                </select>
              </div>

              <div class="param-item">
                <label for="param-wake">Wake / Active Window</label>
                <div style="display: flex; gap: 6px;">
                  <input type="time" id="param-wake" class="param-input" value="${this.config.wakeTime}" title="Wake time">
                  <input type="time" id="param-sleep" class="param-input" value="${this.config.sleepTime}" title="Sleep time">
                </div>
              </div>
            </div>

            <!-- Action Trigger -->
            <div class="intake-actions">
              <span id="pipeline-status-text" style="font-size: 0.76rem; color: var(--text-muted);">
                Autonomous agents ready.
              </span>
              <button class="btn btn-primary" id="btn-run-pipeline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Organize My Day
              </button>
            </div>
          </section>

          <!-- Agent Reasoning Inspector -->
          <div id="agent-reasoning-container"></div>
        </aside>

        <!-- Right: Visual Calendar & Timeline -->
        <section class="right-column">
          <div id="calendar-timeline-container"></div>
        </section>
      </main>

      <!-- Bottom: GitHub-Style Contribution Heatmap Matrix -->
      <section class="growth-section">
        <div class="growth-header">
          <div class="growth-title-box">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Daily Inputs & Focus Contribution Matrix
            </h2>
            <p>GitHub-style productivity visualization tracking completed blocks, daily focus hours, and growth momentum.</p>
          </div>

          <div class="growth-metrics-row">
            <div class="stat-pill">
              <span>Current Streak:</span>
              <strong style="color: var(--accent-amber);">${metrics.currentStreak} Days</strong>
            </div>
            <div class="stat-pill">
              <span>All-Time Best:</span>
              <strong style="color: var(--accent-indigo);">${metrics.longestStreak} Days</strong>
            </div>
            <div class="stat-pill">
              <span>Consistency:</span>
              <strong style="color: var(--accent-emerald);">${metrics.completionRate}</strong>
            </div>
          </div>
        </div>

        <div class="heatmap-container-outer" id="heatmap-graph-container"></div>
      </section>
    `;
  }

  initComponents() {
    // 1. Calendar Timeline Component
    this.timelineComponent = new CalendarTimeline('calendar-timeline-container', {
      schedule: this.schedule,
      onScheduleChange: (newSchedule) => {
        this.schedule = newSchedule;
        saveStoredSchedule(this.schedule);
        this.syncContributionWithToday();
      },
      onTaskCompleted: (task, fullSchedule) => {
        this.syncContributionWithToday();
      }
    });
    this.timelineComponent.render();

    // 2. Heatmap Component
    this.heatmapComponent = new HeatmapGraph('heatmap-graph-container', {
      history: this.history,
      onSelectDate: (dateStr) => {
        const item = this.history[dateStr];
        if (item) {
          const hrs = Math.round((item.focusMinutes / 60) * 10) / 10;
          alert(`Activity for ${dateStr}:\n• ${item.completedTasks} tasks completed\n• ${hrs} hours of focused deep work\n• Score: ${item.count * 10} pts`);
        }
      }
    });
    this.heatmapComponent.render();

    // 3. Agent Reasoning View
    this.reasoningComponent = new AgentReasoningView('agent-reasoning-container');
    this.reasoningComponent.render();
  }

  attachEventListeners() {
    // Run Pipeline Button
    const runBtn = document.getElementById('btn-run-pipeline');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.handleRunPipeline());
    }

    // Preset buttons
    const presetBtns = document.querySelectorAll('.preset-chip');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        this.loadPreset(presetKey);
      });
    });

    // Reset day button
    const resetBtn = document.getElementById('btn-reset-day');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Clear current schedule to start fresh?')) {
          this.schedule = [];
          saveStoredSchedule([]);
          this.timelineComponent.setSchedule([]);
          document.getElementById('intake-input-text').value = '';
        }
      });
    }

    // Config changes
    const chronotypeSelect = document.getElementById('param-chronotype');
    const wakeInput = document.getElementById('param-wake');
    const sleepInput = document.getElementById('param-sleep');

    const updateConfig = () => {
      this.config = {
        chronotype: chronotypeSelect.value,
        wakeTime: wakeInput.value,
        sleepTime: sleepInput.value
      };
      saveStoredConfig(this.config);
    };

    if (chronotypeSelect) chronotypeSelect.addEventListener('change', updateConfig);
    if (wakeInput) wakeInput.addEventListener('change', updateConfig);
    if (sleepInput) sleepInput.addEventListener('change', updateConfig);
  }

  loadPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const textarea = document.getElementById('intake-input-text');
    if (textarea) {
      textarea.value = preset.prompt;
    }
    this.handleRunPipeline();
  }

  async handleRunPipeline() {
    const textarea = document.getElementById('intake-input-text');
    const runBtn = document.getElementById('btn-run-pipeline');
    const statusText = document.getElementById('pipeline-status-text');
    const prompt = textarea.value.trim();

    if (!prompt) {
      alert('Please enter your tasks, commitments, or select a preset to generate a schedule.');
      return;
    }

    runBtn.disabled = true;
    runBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" class="spin-icon">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
      </svg>
      Synthesizing...
    `;

    try {
      const result = await runAgenticPipeline(
        prompt,
        this.config,
        (progress) => {
          if (statusText) statusText.innerText = `${progress.agent}: ${progress.message}`;
          this.reasoningComponent.updateProgress(progress);
        }
      );

      this.schedule = result.schedule;
      saveStoredSchedule(this.schedule);
      this.timelineComponent.setSchedule(this.schedule);
      this.reasoningComponent.setLogs(result.agentLogs);

      if (statusText) {
        statusText.innerText = `✅ Pipeline complete: ${this.schedule.length} blocks organized.`;
      }

      this.syncContributionWithToday();
    } catch (err) {
      console.error('Pipeline error:', err);
      if (statusText) statusText.innerText = `Error running agents: ${err.message}`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Re-Organize Day
      `;
    }
  }

  syncContributionWithToday() {
    const completedTasks = this.schedule.filter(s => s.completed).length;
    const focusMinutes = this.schedule
      .filter(s => s.completed && (s.category === 'deep-work' || s.category === 'goal-chunk'))
      .reduce((acc, s) => acc + (s.duration || 0), 0);

    // Also factor scheduled items so creating a plan immediately adds activity
    const totalPlannedMinutes = this.schedule.reduce((acc, s) => acc + (s.duration || 0), 0);
    const effectiveMinutes = Math.max(focusMinutes, Math.floor(totalPlannedMinutes * 0.4));
    const effectiveCount = Math.max(completedTasks, 2);

    this.history = GrowthAgent.updateDailyContribution(
      this.todayStr,
      effectiveCount,
      effectiveMinutes,
      this.history
    );

    saveStoredHistory(this.history);
    this.heatmapComponent.updateHistory(this.history);

    // Update header pills
    const metrics = GrowthAgent.calculateMetrics(this.history);
    const streakEl = document.getElementById('header-streak-pill');
    const focusEl = document.getElementById('header-focus-pill');
    if (streakEl) {
      streakEl.innerHTML = `<span class="fire-icon">🔥</span><span><strong>${metrics.currentStreak}</strong> Day Streak</span>`;
    }
    if (focusEl) {
      focusEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg><span><strong>${metrics.totalFocusHours}</strong> Focus Hrs</span>`;
    }
  }
}

// Bootstrap application on load
window.addEventListener('DOMContentLoaded', () => {
  new ChronoFlowApp();
});
