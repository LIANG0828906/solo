import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

// 格式化截止时间
export function formatDeadline(deadline: string): string {
  return dayjs(deadline).format('YYYY-MM-DD HH:mm');
}

// 根据进度返回颜色（绿到红渐变）
export function getProgressColor(current: number, max: number): string {
  if (max <= 0) return '#4caf50';
  const ratio = Math.min(current / max, 1);
  const green = Math.round(76 + (255 - 76) * ratio);
  const red = Math.round(255 * ratio);
  return `rgb(${red}, ${green}, 80)`;
}

// 生成唯一ID
export function generateId(): string {
  return uuidv4();
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  } as T;
}
