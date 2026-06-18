import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { EstimatedMinutes } from '../types';

export const formatDate = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatReadableDate = (date: Date = new Date()): string => {
  return format(date, 'yyyy年MM月dd日 EEEE', { locale: zhCN });
};

export const formatEstimatedTime = (minutes: EstimatedMinutes): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatTotalWorkHours = (totalMinutes: number): string => {
  if (totalMinutes === 0) {
    return '0分钟';
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (mins > 0) {
    parts.push(`${mins}分钟`);
  }
  return parts.join('');
};

export const formatReportTitle = (date: Date = new Date()): string => {
  return `今日工作汇报 ${formatDate(date)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getPriorityColor = (priority: 'P0' | 'P1' | 'P2'): string => {
  const colors: Record<string, string> = {
    P0: '#EF4444',
    P1: '#F97316',
    P2: '#9CA3AF',
  };
  return colors[priority] || colors.P2;
};
