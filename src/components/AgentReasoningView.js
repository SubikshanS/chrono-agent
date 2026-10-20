import { escapeHtml } from '../utils/sanitize.js';

export class AgentReasoningView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentStep = 0;
    this.logs = [];
    this.viewMode = 'summary'; // 'summary' | 'logs'
    this.agentSteps = [
      {
        id: 1,
        name: 'IntakeAgent',
        role: 'NLP & Constraint Extraction',
        thought: 'Awaiting user input or scenario preset...',
        status: 'idle'
      },
      {
        id: 2,
        name: 'GoalDecomposer',
        role: 'Milestone Synthesizer',
        thought: 'Standby for multi-hour goals to decompose...',
        status: 'idle'
      },
      {
        id: 3,
        name: 'EnergyOptimizer',
        role: 'Circadian Ultradian Matcher',
        thought: 'Standby for chronotype energy alignment...',
        status: 'idle'
      },
      {
        id: 4,
        name: 'ConflictResolver',
        role: 'Schedule Assembler & Buffering',
        thought: 'Standby to eliminate collisions & lock timeblocks...',
        status: 'idle'
      }
    ];
  }

  updateProgress(stepInfo) {
    const stepObj = this.agentSteps.find(s => s.id === stepInfo.step);
    if (stepObj) {
      stepObj.status = stepInfo.status.toLowerCase();
      stepObj.thought = stepInfo.message;
    }
    // Mark previous steps as completed
    this.agentSteps.forEach(s => {
      if (s.id < stepInfo.step) {
        s.status = 'completed';
      }
    });
    this.render();
  }

  setLogs(logs) {
    this.logs = logs;
    this.agentSteps.forEach(s => {
      s.status = 'completed';
    });
    this.render();
  }

  render() {
    if (!this.container) return;

    let html = `
      <div class="glass-panel reasoning-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            Agent Deliberation & Intelligence
          </div>

          <div class="timeline-view-modes">
            <button class="view-btn ${this.viewMode === 'summary' ? 'active' : ''}" id="btn-reason-summary">Agents</button>
            <button class="view-btn ${this.viewMode === 'logs' ? 'active' : ''}" id="btn-reason-logs">Raw Trace</button>
          </div>
        </div>
    `;

    if (this.viewMode === 'summary') {
      html += `<div class="agent-pipeline-steps">`;
      this.agentSteps.forEach(step => {
        const isRunning = step.status === 'running';
        const isDone = step.status === 'completed';

        html += `
          <div class="agent-step-card ${isRunning ? 'active' : ''} ${isDone ? 'completed' : ''}">
            <div class="agent-header-row">
              <span class="agent-badge">
                ${step.name}
              </span>
              <div class="agent-status-indicator">
                ${isRunning ? `<div class="pulse-dot"></div> <span style="color: var(--accent-emerald);">Processing</span>` : ''}
                ${isDone ? `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style="color: var(--accent-emerald); font-weight: 600;">Resolved</span>
                ` : ''}
                ${step.status === 'idle' ? `<span>Idle</span>` : ''}
              </div>
            </div>
            <div class="agent-thought-text">
              ${escapeHtml(step.thought)}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      // Raw log view
      html += `
        <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.75rem; max-height: 250px; overflow-y: auto; color: #a5f3fc; line-height: 1.6;">
          ${this.logs.length === 0 ? '<div style="color: var(--text-muted);">No execution logs yet. Generate schedule to inspect multi-agent trace.</div>' : ''}
          ${this.logs.map(l => `<div>${escapeHtml(l)}</div>`).join('')}
        </div>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const btnSummary = this.container.querySelector('#btn-reason-summary');
    const btnLogs = this.container.querySelector('#btn-reason-logs');

    if (btnSummary && btnLogs) {
      btnSummary.addEventListener('click', () => {
        this.viewMode = 'summary';
        this.render();
      });
      btnLogs.addEventListener('click', () => {
        this.viewMode = 'logs';
        this.render();
      });
    }
  }
}
