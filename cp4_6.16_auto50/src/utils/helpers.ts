import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy年MM月dd日', { locale: zhCN });
};

export const formatMonth = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MM月', { locale: zhCN });
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  return Math.abs(differenceInDays(date1, date2));
};

export const getSwapLineColor = (days: number): string => {
  if (days <= 7) return '#87CEEB';
  if (days <= 30) return '#98D8C8';
  if (days <= 90) return '#F7DC6F';
  if (days <= 180) return '#F5B041';
  return '#E74C3C';
};

export const getTagColor = (tag: string): string => {
  const colors: Record<string, string> = {
    '电子': '#FF6B6B',
    '书籍': '#4ECDC4',
    '衣物': '#45B7D1',
    '家居': '#96CEB4',
    '玩具': '#FFEAA7',
    '工具': '#DDA0DD',
    '运动': '#98D8C8',
    '其他': '#B0B0B0',
  };
  return colors[tag] || colors['其他'];
};

export const generateAvatar = (seed: string): string => {
  const colors = ['#E8A87C', '#41B3A3', '#C38D9E', '#85DCBA', '#E27D60', '#88D8B0'];
  const index = seed.charCodeAt(0) % colors.length;
  const bgColor = colors[index].replace('#', '');
  const initial = seed.charAt(0).toUpperCase();
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23${bgColor}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' font-weight='bold' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

export const cn = (...classes: (string | false | null | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};
