import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'M月d日', { locale: zhCN });
}

export function getWeekStartDate(date: Date = new Date()): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return formatDate(start);
}

export function getWeekDays(weekStartDate: string): string[] {
  const start = new Date(weekStartDate);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(formatDate(addDays(start, i)));
  }
  return days;
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
}

export function getLast12Months(): { year: number; month: number; label: string }[] {
  const months: { year: number; month: number; label: string }[] = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(today, i);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: format(date, 'yyyy年M月', { locale: zhCN }),
    });
  }
  
  return months;
}

export function getDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
}

export function isToday(date: string): boolean {
  return formatDate(new Date()) === date;
}

export function getFourWeeksRange(): { start: string; end: string; days: string[] } {
  const end = new Date();
  const start = addDays(end, -27);
  const days: string[] = [];
  
  for (let i = 0; i < 28; i++) {
    days.push(formatDate(addDays(start, i)));
  }
  
  return {
    start: formatDate(start),
    end: formatDate(end),
    days,
  };
}
