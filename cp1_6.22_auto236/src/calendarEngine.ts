export interface CareTask {
  id: string;
  plantId: string;
  type: 'water' | 'fertilize' | 'prune';
  intervalDays: number;
  lastDone: string;
  nextDue: string;
  completed: boolean;
  lastCompletedAt?: string;
}

export interface GrowthRecord {
  id: string;
  plantId: string;
  date: string;
  photoColor: string;
  notes: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  records: GrowthRecord[];
  isToday: boolean;
}

export function calculateNextCareDate(lastDone: string, intervalDays: number): string {
  const d = new Date(lastDone);
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().split('T')[0];
}

export function checkDueNotifications(taskList: CareTask[]): Array<CareTask & { urgent: boolean }> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return taskList
    .filter(t => !t.completed)
    .filter(t => {
      const due = new Date(t.nextDue);
      return due <= tomorrow;
    })
    .map(t => ({
      ...t,
      urgent: new Date(t.nextDue) <= now,
    }));
}

export function generateCalendarGrid(
  year: number,
  month: number,
  allRecords: GrowthRecord[]
): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const days: CalendarDay[] = [];

  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const m = month - 1;
    const y = m < 1 ? year - 1 : year;
    const actualM = m < 1 ? 12 : m;
    const date = `${y}-${String(actualM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      records: allRecords.filter(r => r.date === date),
      isToday: date === todayStr,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: true,
      records: allRecords.filter(r => r.date === date),
      isToday: date === todayStr,
    });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 1;
    const y = m > 12 ? year + 1 : year;
    const actualM = m > 12 ? 1 : m;
    const date = `${y}-${String(actualM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: false,
      records: allRecords.filter(r => r.date === date),
      isToday: date === todayStr,
    });
  }

  return days;
}

export function getHoursUntilDue(nextDue: string): number {
  const due = new Date(nextDue);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

export function isUrgent(nextDue: string): boolean {
  return getHoursUntilDue(nextDue) <= 24;
}

export function formatCountdown(nextDue: string): string {
  const hours = getHoursUntilDue(nextDue);
  if (hours <= 0) return '已过期';
  if (hours <= 24) return `${hours}小时后到期`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days}天${remainHours}小时`;
}

export function getTaskTypeLabel(type: 'water' | 'fertilize' | 'prune'): string {
  const labels: Record<string, string> = {
    water: '浇水',
    fertilize: '施肥',
    prune: '修剪',
  };
  return labels[type] || type;
}

export function getTaskTypeEmoji(type: 'water' | 'fertilize' | 'prune'): string {
  const emojis: Record<string, string> = {
    water: '💧',
    fertilize: '🌱',
    prune: '✂️',
  };
  return emojis[type] || '📋';
}

export function renderSimpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}
