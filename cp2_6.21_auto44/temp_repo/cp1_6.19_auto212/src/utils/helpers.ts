import type { ItemStatus } from '@/types';

function randomHex(count: number): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < count; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateAnonymousId(type: 'lost' | 'found'): string {
  const prefix = type === 'lost' ? '失主#' : '拾获者#';
  return prefix + randomHex(4);
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function getStatusText(status: ItemStatus): string {
  switch (status) {
    case 'pending':
      return '待匹配';
    case 'matched':
      return '已匹配';
    case 'completed':
      return '已完成';
    default:
      return status;
  }
}
