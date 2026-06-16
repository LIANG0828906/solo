import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import type { CareLog, CareType } from '@/types';

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  water: '浇水',
  fertilize: '施肥',
  prune: '修剪',
  sunlight: '日照调整',
};

export const CARE_TYPE_COLORS: Record<CareType, string> = {
  water: '#4A90D9',
  fertilize: '#E8913A',
  prune: '#8B5E3C',
  sunlight: '#F5B700',
};

export function formatDate(date: string | Date, fmt = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm');
}

export function getWeekRange(date: Date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getDaysInMonth(year: number, month: number) {
  return eachDayOfInterval({
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0),
  });
}

export function groupLogsByDate(logs: CareLog[]): Record<string, CareLog[]> {
  const grouped: Record<string, CareLog[]> = {};
  for (const log of logs) {
    const key = formatDate(log.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }
  return grouped;
}

export function getRecordsColor(recordsCount: number): string {
  if (recordsCount === 0) return 'transparent';
  if (recordsCount <= 2) return 'rgba(91, 140, 90, 0.15)';
  if (recordsCount <= 5) return 'rgba(91, 140, 90, 0.35)';
  return 'rgba(91, 140, 90, 0.6)';
}

export function getTextColor(recordsCount: number): string {
  if (recordsCount >= 6) return '#FFFFFF';
  return '#2C3E2D';
}

export function extractKeywords(note?: string): string[] {
  if (!note) return [];
  const keywords = ['生长', '开花', '新叶', '发芽', '枯萎', '黄叶', '健康', '茂盛', '根系', '移植'];
  return keywords.filter((k) => note.includes(k));
}
