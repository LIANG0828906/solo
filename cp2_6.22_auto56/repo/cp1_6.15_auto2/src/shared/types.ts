export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Lane = 'todo' | 'inProgress' | 'done';
export type TaskType = 'task' | 'milestone';
export type EmojiVote = 'happy' | 'neutral' | 'sad';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  remainingHours: number;
  lane: Lane;
  order: number;
  type: TaskType;
  sprintId: string;
}

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface Vote {
  taskId: string;
  voter: string;
  emoji: EmojiVote;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  color: string;
  taskCount?: number;
  totalHours?: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
}

export type ActiveTab = 'board' | 'graph' | 'retro';

export const LANE_CONFIG: { key: Lane; label: string; color: string; bgColor: string }[] = [
  { key: 'todo', label: '待办', color: 'border-macaron-purple', bgColor: 'bg-macaron-lavender/40' },
  { key: 'inProgress', label: '进行中', color: 'border-macaron-mint', bgColor: 'bg-macaron-mint/20' },
  { key: 'done', label: '完成', color: 'border-macaron-pink', bgColor: 'bg-macaron-cream/60' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: 'text-gray-500', bg: 'bg-gray-100' },
  medium: { label: '中', color: 'text-blue-600', bg: 'bg-blue-50' },
  high: { label: '高', color: 'text-orange-600', bg: 'bg-orange-50' },
  urgent: { label: '紧急', color: 'text-red-600', bg: 'bg-red-50' },
};
