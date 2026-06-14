import type { PriorityLevel } from '@/types';

export function calculatePriorityScore(rank: number, difficulty: number): number {
  return Math.round(rank * difficulty * 10) / 10;
}

export function getPriorityLevel(priority: number, total: number): PriorityLevel {
  if (total <= 0) return 'low';
  const ratio = (priority + 1) / total;
  if (ratio <= 0.3) return 'high';
  if (ratio <= 0.6) return 'medium';
  return 'low';
}

export function getPriorityColor(level: PriorityLevel): string {
  switch (level) {
    case 'high':
      return '#E74C3C';
    case 'medium':
      return '#F39C12';
    case 'low':
      return '#95A5A6';
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `${year}年${parseInt(month)}月`;
}

export function isValidIsbn(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  if (cleaned.length !== 10 && cleaned.length !== 13) return false;
  return /^\d+$/.test(cleaned.replace(/X$/, ''));
}
