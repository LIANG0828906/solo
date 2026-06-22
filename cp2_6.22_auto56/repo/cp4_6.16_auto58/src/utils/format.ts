import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(ts: number, pattern: string = 'yyyy-MM-dd'): string {
  return format(ts, pattern, { locale: zhCN });
}

export function formatDateTime(ts: number): string {
  return format(ts, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} 分钟`;
  }
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins > 0 ? `${whole} 小时 ${mins} 分` : `${whole} 小时`;
}

export function getDifficultyLabel(level: 'easy' | 'medium' | 'hard'): string {
  return { easy: '简单', medium: '中等', hard: '困难' }[level];
}

export function getDifficultyColor(level: 'easy' | 'medium' | 'hard'): string {
  return {
    easy: '#7CB342',
    medium: '#FB8C00',
    hard: '#E53935'
  }[level];
}
