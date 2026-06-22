export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

export function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export function getStreakDays(records: { date: string; minutes: number }[]): number {
  if (records.length === 0) return 0;
  const dateSet = new Set(
    records.filter((r) => r.minutes > 0).map((r) => r.date)
  );
  let streak = 0;
  const today = new Date();
  let current = new Date(today);
  while (true) {
    const dateStr = formatDate(current);
    if (dateSet.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (streak === 0 && isSameDay(current, today)) {
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getTotalDays(records: { date: string; minutes: number }[]): number {
  const dateSet = new Set(
    records.filter((r) => r.minutes > 0).map((r) => r.date)
  );
  return dateSet.size;
}

export function getMinutesLevel(minutes: number): 'none' | 'light' | 'medium' | 'deep' {
  if (minutes <= 0) return 'none';
  if (minutes < 30) return 'light';
  if (minutes < 60) return 'medium';
  return 'deep';
}
