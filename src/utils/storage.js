/**
 * Persistent Storage & History Generator
 * Manages localStorage synchronization and realistic historical seed data for the contribution graph.
 */

const STORAGE_KEYS = {
  SCHEDULE: 'chronoflow_schedule',
  HISTORY: 'chronoflow_history',
  CONFIG: 'chronoflow_config'
};

export function getStoredConfig() {
  const defaults = {
    wakeTime: '07:00',
    sleepTime: '23:00',
    chronotype: 'morning-lark'
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch (e) {
    return defaults;
  }
}

export function saveStoredConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function getStoredSchedule() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredSchedule(schedule) {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  } catch (e) {
    console.error('Failed to save schedule', e);
  }
}

export function getStoredHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse history', e);
  }
  return {};
}

export function clearAllStoredData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
}

export function saveStoredHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history', e);
  }
}

function generateRealisticHistory() {
  const history = {};
  const today = new Date();
  const days = 365;

  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Simulate realistic productivity patterns:
    // Higher probability of activity on weekdays, occasional weekend sprints, realistic streaks
    const rand = Math.random();
    let level = 0;
    let focusMinutes = 0;
    let completedTasks = 0;

    if (isWeekend) {
      if (rand > 0.6) {
        level = 1;
        focusMinutes = 60;
        completedTasks = 2;
      } else if (rand > 0.85) {
        level = 2;
        focusMinutes = 120;
        completedTasks = 3;
      }
    } else {
      // Weekdays: 85% probability of solid work
      if (rand > 0.8) {
        level = 4; // High output sprint
        focusMinutes = 260 + Math.floor(Math.random() * 80);
        completedTasks = 6 + Math.floor(Math.random() * 3);
      } else if (rand > 0.5) {
        level = 3; // Good focus day
        focusMinutes = 180 + Math.floor(Math.random() * 60);
        completedTasks = 4 + Math.floor(Math.random() * 2);
      } else if (rand > 0.2) {
        level = 2; // Moderate day
        focusMinutes = 120 + Math.floor(Math.random() * 40);
        completedTasks = 3;
      } else if (rand > 0.08) {
        level = 1;
        focusMinutes = 60;
        completedTasks = 1;
      } else {
        level = 0; // Rest / sick day
      }
    }

    // Ensure recent 14 days are active to form a solid motivating streak
    if (i <= 14 && i > 0) {
      level = Math.max(level, (i % 3 === 0 ? 4 : (i % 2 === 0 ? 3 : 2)));
      focusMinutes = Math.max(focusMinutes, 150);
      completedTasks = Math.max(completedTasks, 3);
    }

    history[dateStr] = {
      level,
      focusMinutes,
      completedTasks,
      count: completedTasks + Math.floor(focusMinutes / 30)
    };
  }

  return history;
}
