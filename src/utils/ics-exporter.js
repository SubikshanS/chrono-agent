/**
 * iCalendar (.ics) Generator & Markdown Exporter
 * Compliant with RFC-5545 for Google Calendar, Apple Calendar, and Outlook.
 */

export function exportToICS(schedule, calendarName = 'ChronoFlow Schedule') {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronoFlow AI//Autonomous Time Architect//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`
  ];

  schedule.forEach((item, index) => {
    const startHour = String(Math.floor(item.startMinute / 60)).padStart(2, '0');
    const startMin = String(item.startMinute % 60).padStart(2, '0');
    const endHour = String(Math.floor(item.endMinute / 60)).padStart(2, '0');
    const endMin = String(item.endMinute % 60).padStart(2, '0');

    const dtStart = `${todayStr}T${startHour}${startMin}00`;
    const dtEnd = `${todayStr}T${endHour}${endMin}00`;
    const uid = `${Date.now()}-${index}@chronoflow.ai`;

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${uid}`);
    icsLines.push(`SUMMARY:${escapeICS(item.title)}`);
    icsLines.push(`DESCRIPTION:Category: ${item.category} | Cognitive Load: ${item.cognitiveLoad || 'medium'}`);
    icsLines.push(`DTSTART:${dtStart}`);
    icsLines.push(`DTEND:${dtEnd}`);
    icsLines.push(`STATUS:${item.completed ? 'COMPLETED' : 'CONFIRMED'}`);
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  const icsBlob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(icsBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `chronoflow-schedule-${todayStr}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

export function copyMarkdownAgenda(schedule) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  let md = `# ChronoFlow Daily Agenda — ${dateStr}\n\n`;
  md += `| Time | Task / Milestone | Category | Load | Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  schedule.forEach(item => {
    const status = item.completed ? '✅ Done' : '⏳ Pending';
    md += `| ${item.startTime} - ${item.endTime} | ${item.title} | ${item.category} | ${item.cognitiveLoad} | ${status} |\n`;
  });

  md += `\n*Optimized by ChronoFlow Autonomous Agentic Engine*\n`;

  navigator.clipboard.writeText(md);
  return md;
}

function escapeICS(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
