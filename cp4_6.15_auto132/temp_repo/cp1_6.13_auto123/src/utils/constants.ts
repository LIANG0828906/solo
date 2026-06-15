export const ICONS = [
  '📚', '🏃', '💧', '🧘', '💪', '✍️', '🎯', '😴', '🥗', '🎨',
];

export const COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181',
  '#aa96da', '#fcbad3', '#a8d8ea', '#6c5ce7', '#00b894',
];

export const TIME_PERIODS = [
  { value: 'morning', label: '早上' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' },
  { value: 'anytime', label: '随时' },
];

export const MILESTONES = [3, 7, 14, 30, 60, 100];

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateCN(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + 1);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getWeekProgress(habit: any, today: Date): { completed: number; total: number } {
  const weekDates = getWeekDates(today);
  const weekDateStrs = weekDates.map(d => formatDate(d));
  const completed = habit.checkins.filter((c: any) =>
    weekDateStrs.includes(c.date) && c.completed
  ).length;
  return { completed, total: habit.frequency };
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

export function isBeforeToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
}
