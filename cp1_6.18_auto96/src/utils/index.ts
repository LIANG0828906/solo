import { v4 as uuidv4 } from 'uuid';
import { BoardNode } from '@/types';

export const generateId = (): string => {
  return uuidv4();
};

export const getTimestamp = (): number => {
  return Date.now();
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const getNodeBottom = (node: BoardNode): { x: number; y: number } => {
  return {
    x: node.x + 120,
    y: node.y + 160,
  };
};

export const getNodeTop = (node: BoardNode): { x: number; y: number } => {
  return {
    x: node.x + 120,
    y: node.y,
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
};

export const getBezierPath = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  offset: number = 0.5
): string => {
  const dy = to.y - from.y;
  const controlOffset = dy * offset;
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + controlOffset}, ${to.x} ${to.y - controlOffset}, ${to.x} ${to.y}`;
};
