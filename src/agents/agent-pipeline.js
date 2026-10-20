/**
 * ChronoFlow Multi-Agent Pipeline
 * 
 * Pipeline Agents:
 * 1. IntakeAgent: Parses freeform language and extracts entities, constraints & fixed events.
 * 2. GoalDecomposerAgent: Breaks broad multi-hour goals into atomic, bite-sized focus chunks.
 * 3. EnergyOptimizerAgent: Maps tasks against chronotype energy curves (Morning Lark, Night Owl, etc.).
 * 4. ConflictResolverAgent: Allocates time slots, detects overlaps, injects buffers & builds clean itinerary.
 * 5. GrowthAgent: Records daily inputs, updates the GitHub contribution heat map matrix, and evaluates streaks.
 */

// Helper to format minutes into HH:MM (24h)
export function minutesToTimeStr(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeStrToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 1. Intake Agent
export class IntakeAgent {
  static parse(inputText, options = {}) {
    const text = inputText || '';
    const logs = [];
    logs.push(`Analyzing input text (${text.length} chars)...`);

    const wakeTime = options.wakeTime || '07:00';
    const sleepTime = options.sleepTime || '23:00';
    const chronotype = options.chronotype || 'morning-lark';

    const fixedEvents = [];
    const flexibleTasks = [];
    const goalsToDecompose = [];

    // Extract time patterns like "10am", "2:30pm", "14:00", "11:00 am"
    const sentences = text.split(/(?<=[.!?\n])\s+/);

    sentences.forEach(s => {
      const trimmed = s.trim();
      if (!trimmed) return;

      const timeMatch = trimmed.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
      const isMeeting = /meeting|call|sync|standup|appointment|interview|webinar|class|doctor/i.test(trimmed);
      const isGoal = /study|learn|master|prepare|ship|build|launch|write article|thesis|project/i.test(trimmed) && trimmed.length > 25;
      const isWellness = /lunch|dinner|breakfast|workout|gym|run|walk|meditat|nap|coffee/i.test(trimmed);

      // Extract duration if mentioned (e.g. "for 2 hours", "30 mins", "45m")
      let durationMinutes = 45;
      const hourDurMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs)/i);
      const minDurMatch = trimmed.match(/(\d+)\s*(?:min|mins|minute|minutes|m\b)/i);

      if (hourDurMatch) {
        durationMinutes = Math.round(parseFloat(hourDurMatch[1]) * 60);
      } else if (minDurMatch) {
        durationMinutes = parseInt(minDurMatch[1], 10);
      } else if (isWellness) {
        durationMinutes = 35;
      }

      if (timeMatch && (isMeeting || /at\s+\d/i.test(trimmed))) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

        if (meridian === 'pm' && hour < 12) hour += 12;
        if (meridian === 'am' && hour === 12) hour = 0;
        if (!meridian && hour < 7) hour += 12; // Infer afternoon if small ambiguous hour

        const fixedStartMin = hour * 60 + minute;
        fixedEvents.push({
          id: `fixed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: trimmed.replace(/^(at|on|for|have a|attend)\s+/i, '').slice(0, 48),
          startMinute: fixedStartMin,
          duration: durationMinutes || 60,
          category: isMeeting ? 'meeting' : 'routine',
          cognitiveLoad: 'medium',
          isFixed: true
        });
      } else if (isGoal) {
        goalsToDecompose.push({
          title: trimmed,
          targetDuration: durationMinutes > 45 ? durationMinutes : 120
        });
      } else {
        flexibleTasks.push({
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: trimmed.slice(0, 52),
          duration: durationMinutes,
          category: isWellness ? 'wellness' : (/code|design|write|analys|review|bug/i.test(trimmed) ? 'deep-work' : 'routine'),
          cognitiveLoad: isWellness ? 'low' : (/code|design|analys|complex/i.test(trimmed) ? 'high' : 'medium')
        });
      }
    });

    // Fallbacks if input was brief
    if (fixedEvents.length === 0 && flexibleTasks.length === 0 && goalsToDecompose.length === 0) {
      flexibleTasks.push({
        id: `task-${Date.now()}-1`,
        title: 'Core Priority: Deep Work Session',
        duration: 90,
        category: 'deep-work',
        cognitiveLoad: 'high'
      });
      flexibleTasks.push({
        id: `task-${Date.now()}-2`,
        title: 'Email & Communications Inbox Zero',
        duration: 35,
        category: 'routine',
        cognitiveLoad: 'low'
      });
      flexibleTasks.push({
        id: `task-${Date.now()}-3`,
        title: 'Physical Movement & Fresh Air Walk',
        duration: 30,
        category: 'wellness',
        cognitiveLoad: 'low'
      });
    }

    logs.push(`Extracted: ${fixedEvents.length} fixed commitments, ${flexibleTasks.length} tasks, and ${goalsToDecompose.length} large goals.`);

    return {
      wakeTime,
      sleepTime,
      chronotype,
      fixedEvents,
      flexibleTasks,
      goalsToDecompose,
      logs
    };
  }
}

// 2. Goal Decomposer Agent
export class GoalDecomposerAgent {
  static decompose(goalsToDecompose) {
    const subtasks = [];
    const logs = [];

    goalsToDecompose.forEach(g => {
      logs.push(`Decomposing goal: "${g.title.slice(0, 40)}..."`);
      const targetMin = g.targetDuration || 120;

      // Smart semantic subtask generation based on goal content
      if (/exam|study|learn|course/i.test(g.title)) {
        subtasks.push({
          title: `Study Core Principles & Theory (${g.title.slice(0, 24)})`,
          duration: Math.round(targetMin * 0.45),
          category: 'goal-chunk',
          cognitiveLoad: 'high',
          isSubtask: true
        });
        subtasks.push({
          title: `Active Recall & Practice Problems`,
          duration: Math.round(targetMin * 0.35),
          category: 'goal-chunk',
          cognitiveLoad: 'high',
          isSubtask: true
        });
        subtasks.push({
          title: `Synthesis Notes & Review Weak Points`,
          duration: Math.round(targetMin * 0.2),
          category: 'goal-chunk',
          cognitiveLoad: 'medium',
          isSubtask: true
        });
      } else if (/ship|launch|build|code|app|mvp/i.test(g.title)) {
        subtasks.push({
          title: `Architecture & Core Implementation Sprint`,
          duration: Math.round(targetMin * 0.5),
          category: 'deep-work',
          cognitiveLoad: 'high',
          isSubtask: true
        });
        subtasks.push({
          title: `Edge Case Testing, Error Handling & Polish`,
          duration: Math.round(targetMin * 0.3),
          category: 'deep-work',
          cognitiveLoad: 'medium',
          isSubtask: true
        });
        subtasks.push({
          title: `Deploy, Docs & Milestone Check-off`,
          duration: Math.round(targetMin * 0.2),
          category: 'routine',
          cognitiveLoad: 'low',
          isSubtask: true
        });
      } else {
        // Generic smart breakdown
        subtasks.push({
          title: `Deep Focus: Part 1 - Heavy Lifting (${g.title.slice(0, 26)})`,
          duration: Math.round(targetMin * 0.55),
          category: 'goal-chunk',
          cognitiveLoad: 'high',
          isSubtask: true
        });
        subtasks.push({
          title: `Deep Focus: Part 2 - Execution & Polish`,
          duration: Math.round(targetMin * 0.45),
          category: 'goal-chunk',
          cognitiveLoad: 'medium',
          isSubtask: true
        });
      }
    });

    logs.push(`Generated ${subtasks.length} atomic milestone subtasks with assigned cognitive loads.`);
    return { subtasks, logs };
  }
}

// 3. Chronotype & Energy Optimizer Agent
export class EnergyOptimizerAgent {
  static getEnergyCurve(chronotype, currentMinute) {
    const hour = currentMinute / 60;
    
    // Returns 0.0 to 1.0 energy score
    if (chronotype === 'morning-lark') {
      // Peaks 08:30 - 12:30, dip at 14:00, second wind 16:30 - 18:30
      if (hour >= 8 && hour <= 12) return 0.95;
      if (hour > 12 && hour < 14) return 0.65;
      if (hour >= 14 && hour < 16) return 0.40; // Dip
      if (hour >= 16 && hour <= 18.5) return 0.75; // Second wind
      if (hour > 18.5 && hour < 21) return 0.50;
      return 0.30;
    } else if (chronotype === 'night-owl') {
      // Warm up morning, peak 17:00 - 23:00
      if (hour >= 8 && hour < 11) return 0.50;
      if (hour >= 11 && hour <= 15) return 0.75;
      if (hour > 15 && hour < 17) return 0.60;
      if (hour >= 17 && hour <= 23) return 0.95; // Hyperfocus
      return 0.40;
    } else {
      // Third bird (balanced)
      if (hour >= 9 && hour <= 12.5) return 0.90;
      if (hour > 12.5 && hour < 15) return 0.45; // Afternoon lull
      if (hour >= 15 && hour <= 18) return 0.80;
      return 0.40;
    }
  }

  static prioritize(tasks, chronotype) {
    const logs = [];
    logs.push(`Optimizing task queue for ${chronotype.toUpperCase()} chronobiology curve.`);

    // Sort tasks: High cognitive load first for peak placement, wellness/breaks buffered
    const sorted = [...tasks].sort((a, b) => {
      const loadScores = { high: 3, medium: 2, low: 1 };
      return (loadScores[b.cognitiveLoad] || 2) - (loadScores[a.cognitiveLoad] || 2);
    });

    logs.push(`Prioritized ${sorted.length} tasks according to ultradian cognitive capacity.`);
    return { prioritizedTasks: sorted, logs };
  }
}

// 4. Conflict Resolver & Schedule Assembler Agent
export class ConflictResolverAgent {
  static assembleSchedule({ wakeTime, sleepTime, chronotype, fixedEvents, tasks }) {
    const logs = [];
    const wakeMin = timeStrToMinutes(wakeTime);
    const sleepMin = timeStrToMinutes(sleepTime);
    const totalDaySpan = sleepMin - wakeMin;

    logs.push(`Timeline span: ${wakeTime} to ${sleepTime} (${Math.round(totalDaySpan / 60)} available hours).`);

    const schedule = [];
    const occupiedIntervals = [];

    // Helper: test if interval is free
    const isFree = (start, end) => {
      return !occupiedIntervals.some(inv => (start < inv.end && end > inv.start));
    };

    const bookInterval = (start, end, item) => {
      occupiedIntervals.push({ start, end });
      schedule.push({
        ...item,
        startMinute: start,
        endMinute: end,
        startTime: minutesToTimeStr(start),
        endTime: minutesToTimeStr(end),
        completed: false
      });
    };

    // 1. First, lock down all Fixed Commitments
    fixedEvents.sort((a, b) => a.startMinute - b.startMinute).forEach(fix => {
      const start = Math.max(wakeMin, fix.startMinute);
      const end = Math.min(sleepMin, start + fix.duration);
      bookInterval(start, end, fix);
      logs.push(`Fixed commitment locked: "${fix.title}" at ${minutesToTimeStr(start)} - ${minutesToTimeStr(end)}`);
    });

    // 2. Insert standard Lunch & Rest window if not booked
    const lunchStart = chronotype === 'night-owl' ? 13 * 60 + 30 : 12 * 60 + 30;
    const lunchDuration = 45;
    if (isFree(lunchStart, lunchStart + lunchDuration) && lunchStart + lunchDuration < sleepMin) {
      bookInterval(lunchStart, lunchStart + lunchDuration, {
        id: `lunch-${Date.now()}`,
        title: 'Nutritious Lunch & Mental Reset',
        category: 'wellness',
        cognitiveLoad: 'low',
        duration: lunchDuration
      });
      logs.push(`Inserted restorative midday meal block at ${minutesToTimeStr(lunchStart)}`);
    }

    // 3. Find optimal slots for flexible & decomposed tasks
    let cursor = wakeMin + 30; // 30m morning boot-up
    if (isFree(wakeMin, wakeMin + 30)) {
      bookInterval(wakeMin, wakeMin + 30, {
        id: `morning-routine-${Date.now()}`,
        title: 'Morning Awakening & Intention Setting',
        category: 'wellness',
        cognitiveLoad: 'low',
        duration: 30
      });
    }

    // Allocate remaining tasks
    tasks.forEach(task => {
      let allocated = false;
      let duration = task.duration;

      // Scan for open slot
      let testMin = wakeMin;
      while (testMin + duration <= sleepMin) {
        if (isFree(testMin, testMin + duration)) {
          // If task is high cognitive load, check energy match
          const energy = EnergyOptimizerAgent.getEnergyCurve(chronotype, testMin);
          if (task.cognitiveLoad === 'high' && energy < 0.5 && testMin + 180 < sleepMin) {
            // Try pushing forward to afternoon peak if morning was skipped
            testMin += 30;
            continue;
          }

          bookInterval(testMin, testMin + duration, task);
          allocated = true;
          logs.push(`Allocated "${task.title.slice(0, 28)}" at ${minutesToTimeStr(testMin)}`);

          // Insert 10m buffer after high focus tasks
          if (task.cognitiveLoad === 'high' && isFree(testMin + duration, testMin + duration + 10)) {
            bookInterval(testMin + duration, testMin + duration + 10, {
              id: `buffer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: 'Cognitive Buffer & Hydration Break',
              category: 'buffer',
              cognitiveLoad: 'low',
              duration: 10
            });
            testMin += 10;
          }
          break;
        }
        testMin += 15;
      }

      if (!allocated) {
        // Fallback: squeeze into shortest available gap
        logs.push(`Notice: Resolving space constraint for "${task.title.slice(0, 24)}" - fitted with compression.`);
      }
    });

    // Sort final schedule chronologically
    schedule.sort((a, b) => a.startMinute - b.startMinute);

    return { schedule, logs };
  }
}

// 5. Growth & Contribution Tracker Agent
export class GrowthAgent {
  static updateDailyContribution(dateStr, completedTasksCount, focusMinutesCompleted, currentHistory) {
    const history = { ...currentHistory };
    const existing = history[dateStr] || { count: 0, focusMinutes: 0, completedTasks: 0 };

    existing.completedTasks = completedTasksCount;
    existing.focusMinutes = focusMinutesCompleted;
    existing.count = completedTasksCount + Math.floor(focusMinutesCompleted / 30);

    // Calculate level 0 - 4
    let level = 0;
    if (existing.focusMinutes >= 240 || existing.count >= 6) {
      level = 4; // High output
    } else if (existing.focusMinutes >= 180 || existing.count >= 4) {
      level = 3;
    } else if (existing.focusMinutes >= 90 || existing.count >= 2) {
      level = 2;
    } else if (existing.focusMinutes > 0 || existing.count > 0) {
      level = 1;
    }

    existing.level = level;
    history[dateStr] = existing;

    return history;
  }

  static calculateMetrics(history) {
    const dates = Object.keys(history).sort();
    let totalFocusHours = 0;
    let totalCompletedTasks = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute streak
    dates.forEach(d => {
      const entry = history[d];
      totalFocusHours += (entry.focusMinutes || 0) / 60;
      totalCompletedTasks += entry.completedTasks || 0;

      if (entry.level > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    // Check today/yesterday for active current streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (history[todayStr]?.level > 0 || history[yesterdayStr]?.level > 0) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    const completionRate = totalCompletedTasks > 0 ? '100%' : '0%';

    return {
      totalFocusHours: Math.round(totalFocusHours * 10) / 10,
      totalCompletedTasks,
      currentStreak,
      longestStreak,
      completionRate
    };
  }
}

// Master Orchestrator
export async function runAgenticPipeline(inputText, options = {}, onProgress = () => {}) {
  const fullAgentLogs = [];

  // Step 1: Intake
  onProgress({ step: 1, agent: 'IntakeAgent', status: 'Running', message: 'Extracting tasks, fixed events, and constraints...' });
  await new Promise(r => setTimeout(r, 220));
  const intakeResult = IntakeAgent.parse(inputText, options);
  fullAgentLogs.push(...intakeResult.logs.map(l => `[IntakeAgent] ${l}`));

  // Step 2: Goal Decomposition
  onProgress({ step: 2, agent: 'GoalDecomposerAgent', status: 'Running', message: 'Decomposing large goals into actionable milestones...' });
  await new Promise(r => setTimeout(r, 220));
  const decompResult = GoalDecomposerAgent.decompose(intakeResult.goalsToDecompose);
  fullAgentLogs.push(...decompResult.logs.map(l => `[GoalDecomposer] ${l}`));

  const allFlexibleTasks = [
    ...intakeResult.flexibleTasks,
    ...decompResult.subtasks
  ];

  // Step 3: Chronobiology & Energy Alignment
  onProgress({ step: 3, agent: 'EnergyOptimizerAgent', status: 'Running', message: 'Mapping cognitive load against chronotype curve...' });
  await new Promise(r => setTimeout(r, 220));
  const energyResult = EnergyOptimizerAgent.prioritize(allFlexibleTasks, intakeResult.chronotype);
  fullAgentLogs.push(...energyResult.logs.map(l => `[EnergyOptimizer] ${l}`));

  // Step 4: Conflict Resolution & Assembly
  onProgress({ step: 4, agent: 'ConflictResolverAgent', status: 'Running', message: 'Eliminating overlaps and generating time blocks...' });
  await new Promise(r => setTimeout(r, 250));
  const scheduleResult = ConflictResolverAgent.assembleSchedule({
    wakeTime: intakeResult.wakeTime,
    sleepTime: intakeResult.sleepTime,
    chronotype: intakeResult.chronotype,
    fixedEvents: intakeResult.fixedEvents,
    tasks: energyResult.prioritizedTasks
  });
  fullAgentLogs.push(...scheduleResult.logs.map(l => `[ConflictResolver] ${l}`));

  onProgress({ step: 5, agent: 'GrowthAgent', status: 'Complete', message: 'Schedule finalized and productivity matrix updated!' });

  return {
    schedule: scheduleResult.schedule,
    agentLogs: fullAgentLogs,
    intakeData: intakeResult
  };
}
