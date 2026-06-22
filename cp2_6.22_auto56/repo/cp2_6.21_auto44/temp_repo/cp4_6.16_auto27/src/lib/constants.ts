import type { TaskType } from '@/types';

export const PRESET_COLORS = [
  '#e94560',
  '#0f3460',
  '#533483',
  '#e07c24',
  '#2ecc71',
  '#3498db',
];

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'work', label: '工作' },
  { value: 'study', label: '学习' },
  { value: 'life', label: '生活' },
  { value: 'exercise', label: '运动' },
  { value: 'social', label: '社交' },
  { value: 'other', label: '其他' },
];

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  work: '#e94560',
  study: '#3498db',
  life: '#2ecc71',
  exercise: '#e07c24',
  social: '#9b59b6',
  other: '#533483',
};

export const MINUTE_PER_SLOT = 15;
export const SLOTS_PER_HOUR = 4;
export const TOTAL_SLOTS = 96;
export const SLOT_WIDTH = 48;
export const TIMELINE_HEIGHT = 360;
export const MAX_LANES = 3;
export const LANE_HEIGHT = 100;

export const ENCOURAGEMENTS = [
  '每一天的努力都在积累，继续加油！',
  '你比自己想象的更有效率！',
  '坚持就是胜利，今天做得很好！',
  '小步前进，终将抵达目标！',
  '时间管理的秘诀就是开始！',
  '今天的你比昨天更棒了！',
  '效率不在于多忙，而在于多专注！',
  '回顾是最好的进步方式！',
  '每个时间块都是对未来的投资！',
  '你正在成为更好的自己！',
];

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function snapToSlot(minutes: number): number {
  return Math.round(minutes / MINUTE_PER_SLOT) * MINUTE_PER_SLOT;
}

export function clampMinutes(v: number): number {
  return Math.max(0, Math.min(1440, v));
}
