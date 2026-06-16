import type { Task, Checkin } from '@/types';

export function generateInviteCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysRemaining(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
}

export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  const colorMap: Record<'high' | 'medium' | 'low', string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };
  return colorMap[priority];
}

export function calculateProgress(tasks: Task[], checkins: Checkin[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  if (totalEstimatedHours === 0) {
    return 0;
  }
  const totalCheckinHours = checkins.reduce((sum, checkin) => sum + checkin.durationHours, 0);
  const progress = Math.min(100, Math.round((totalCheckinHours / totalEstimatedHours) * 100));
  return progress;
}
