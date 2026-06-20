import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN');
};

export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const getDefaultComponent = (
  type: string,
  screenId: string,
  x: number = 100,
  y: number = 100
): Omit<import('../types').Component, 'id'> => {
  const base = {
    screenId,
    x,
    y,
    width: 120,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderColor: '#CBD5E1',
  };

  switch (type) {
    case 'rectangle':
      return { ...base, type: 'rectangle' };
    case 'circle':
      return { ...base, type: 'circle', width: 80, height: 80, borderRadius: 40 };
    case 'text':
      return { ...base, type: 'text', text: '文本内容', fontSize: 14, fontWeight: 'normal', width: 150, height: 30, backgroundColor: 'transparent', borderColor: 'transparent' };
    case 'image':
      return { ...base, type: 'image', width: 160, height: 120, imageUrl: '' };
    case 'button':
      return { ...base, type: 'button', text: '按钮', fontSize: 14, fontWeight: '500', backgroundColor: '#6366F1', borderColor: '#6366F1' };
    default:
      return { ...base, type: 'rectangle' };
  }
};
