import type { KRType } from '@/types';

export interface ProgressInfo {
  percentage: number;
  color: string;
  bgClass: string;
  textClass: string;
  transitionDuration: string;
}

export function calculatePercentage(
  type: KRType,
  initialValue: number,
  targetValue: number,
  currentValue: number
): number {
  switch (type) {
    case 'numeric': {
      if (targetValue === initialValue) return 0;
      const pct = ((currentValue - initialValue) / (targetValue - initialValue)) * 100;
      return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
    }
    case 'boolean':
      return currentValue >= targetValue ? 100 : 0;
    case 'percentage':
      return Math.max(0, Math.min(100, Math.round(currentValue * 10) / 10));
    default:
      return 0;
  }
}

export function getColorForPercentage(percentage: number): string {
  if (percentage <= 30) return '#ef4444';
  if (percentage <= 70) return '#f59e0b';
  return '#22c55e';
}

export function getBgClassForPercentage(percentage: number): string {
  if (percentage <= 30) return 'bg-red-500';
  if (percentage <= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function getTextClassForPercentage(percentage: number): string {
  if (percentage <= 30) return 'text-red-600';
  if (percentage <= 70) return 'text-yellow-600';
  return 'text-green-600';
}

export function getProgressInfo(
  type: KRType,
  initialValue: number,
  targetValue: number,
  currentValue: number
): ProgressInfo {
  const percentage = calculatePercentage(type, initialValue, targetValue, currentValue);
  return {
    percentage,
    color: getColorForPercentage(percentage),
    bgClass: getBgClassForPercentage(percentage),
    textClass: getTextClassForPercentage(percentage),
    transitionDuration: '1000ms',
  };
}

export function getTypeLabel(type: KRType): string {
  switch (type) {
    case 'numeric': return '数值型';
    case 'boolean': return '布尔型';
    case 'percentage': return '百分比型';
  }
}

export function getTypeBadgeClass(type: KRType): string {
  switch (type) {
    case 'numeric': return 'bg-blue-100 text-blue-700';
    case 'boolean': return 'bg-purple-100 text-purple-700';
    case 'percentage': return 'bg-orange-100 text-orange-700';
  }
}
