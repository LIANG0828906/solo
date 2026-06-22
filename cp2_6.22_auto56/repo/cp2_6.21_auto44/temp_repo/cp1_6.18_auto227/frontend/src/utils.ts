import { Priority } from './types';

export const MINUTES_15 = 15 * 60 * 1000;
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const snapTo15Minutes = (time: number): number => {
  return Math.round(time / MINUTES_15) * MINUTES_15;
};

export const getPriorityColors = (priority: Priority): { border: string; particle: string; label: string } => {
  switch (priority) {
    case 'high':
      return {
        border: 'linear-gradient(135deg, #FF4500, #FF6347)',
        particle: '#FF4500',
        label: '高'
      };
    case 'medium':
      return {
        border: 'linear-gradient(135deg, #FFA500, #FF8C00)',
        particle: '#FFA500',
        label: '中'
      };
    case 'low':
    default:
      return {
        border: 'linear-gradient(135deg, #32CD32, #228B22)',
        particle: '#8B8B8B',
        label: '低'
      };
  }
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

export const getStartOfDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const getRandomCursorColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const timeToPixel = (time: number, baseTime: number, pixelsPerHour: number): number => {
  return ((time - baseTime) / HOUR) * pixelsPerHour;
};

export const pixelToTime = (pixel: number, baseTime: number, pixelsPerHour: number): number => {
  return baseTime + (pixel / pixelsPerHour) * HOUR;
};
