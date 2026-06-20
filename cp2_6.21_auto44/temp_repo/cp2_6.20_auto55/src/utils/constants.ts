import type { VoteType, VoteStatus } from '@/types';

export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  single: '单选',
  multiple: '多选',
  rank: '排名',
  score: '评分',
};

export const VOTE_TYPE_ICONS: Record<VoteType, string> = {
  single: '●',
  multiple: '■',
  rank: '☰',
  score: '★',
};

export const STATUS_LABELS: Record<VoteStatus, string> = {
  todo: '待办',
  active: '进行中',
  ended: '已结束',
};

export const COLORS = {
  primary: '#4a90d9',
  secondary: '#ff7b54',
  background: '#1a1f36',
  card: '#2a2f4a',
  text: '#ffffff',
  textSecondary: '#a0a5c0',
  success: '#4caf50',
  error: '#f44336',
};

export const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '创建时间（最新）' },
  { value: 'createdAt_asc', label: '创建时间（最早）' },
  { value: 'deadline_asc', label: '截止时间（最近）' },
  { value: 'deadline_desc', label: '截止时间（最远）' },
];

export const MAX_SCORE_DEFAULT = 10;
