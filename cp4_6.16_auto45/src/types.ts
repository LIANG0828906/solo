export type IdeaStatus = 'fresh' | 'hatching' | 'launched' | 'abandoned';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Milestone {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  priority: PriorityLevel;
  completed: boolean;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  creativeScore: number;
  status: IdeaStatus;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  fresh: '新鲜想法',
  hatching: '正在孵化',
  launched: '已启动',
  abandoned: '已放弃',
};

export const STATUS_COLORS: Record<IdeaStatus, string> = {
  fresh: 'rgba(167, 139, 250, 0.25)',
  hatching: 'rgba(52, 211, 153, 0.25)',
  launched: 'rgba(251, 146, 60, 0.25)',
  abandoned: 'rgba(156, 163, 175, 0.25)',
};

export const STATUS_LABEL_COLORS: Record<IdeaStatus, string> = {
  fresh: '#a78bfa',
  hatching: '#34d399',
  launched: '#fb923c',
  abandoned: '#9ca3af',
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  high: '#ef4444',
  medium: '#3b82f6',
  low: '#22c55e',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const MAX_IDEAS = 20;
export const MAX_MILESTONES = 10;
