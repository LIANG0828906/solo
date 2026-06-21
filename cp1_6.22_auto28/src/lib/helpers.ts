import { v4 as uuidv4 } from 'uuid';
import type { Task } from '@/lib/api';

const TYPE_COLORS: Record<Task['type'], string> = {
  daily: '#4A90D9',
  shopping: '#E67E22',
  study: '#27AE60',
};

const TYPE_LABELS: Record<Task['type'], string> = {
  daily: '日常',
  shopping: '购物',
  study: '学习',
};

export function getTypeColor(type: Task['type']): string {
  return TYPE_COLORS[type] || TYPE_COLORS.daily;
}

export function getTypeLabel(type: Task['type']): string {
  return TYPE_LABELS[type] || TYPE_LABELS.daily;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export function generateConfettiPieces(x: number, y: number): Array<{
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  rot: number;
  color: string;
}> {
  const colors = ['#4A90D9', '#E67E22', '#27AE60', '#E74C3C', '#9B59B6', '#F1C40F', '#1ABC9C'];
  const pieces = [];
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
    const distance = 40 + Math.random() * 80;
    pieces.push({
      id: uuidv4(),
      x,
      y,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 30,
      rot: Math.random() * 720 - 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return pieces;
}
