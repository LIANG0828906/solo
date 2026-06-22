export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type EmotionType = 'happy' | 'sad' | 'angry' | 'proud' | 'tired' | null;
export type RetroPeriod = 'week' | 'twoWeeks' | 'month';

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatarGradient: string;
  createdAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  emotion: EmotionType;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
}

export interface RetroReport {
  period: RetroPeriod;
  startDate: string;
  endDate: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  emotionStats: Record<string, number>;
  wordCloud: { word: string; count: number }[];
}

export interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

export interface EmotionConfig {
  emoji: string;
  color: string;
  label: string;
}

export const EMOTION_MAP: Record<string, EmotionConfig> = {
  happy: { emoji: '😊', color: '#FFD93D', label: '快乐' },
  sad: { emoji: '😢', color: '#6C9BCF', label: '悲伤' },
  angry: { emoji: '😠', color: '#E74C3C', label: '愤怒' },
  proud: { emoji: '💪', color: '#2ECC71', label: '自豪' },
  tired: { emoji: '😧', color: '#9B59B6', label: '疲惫' },
};

export const STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: '待办', color: '#FFB74D' },
  'in-progress': { label: '进行中', color: '#42A5F5' },
  review: { label: '审核', color: '#AB47BC' },
  done: { label: '已完成', color: '#66BB6A' },
};

export const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '他', '她', '它', '们', '这个', '那个', '什么', '怎么',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'up', 'about', 'into', 'over', 'after', 'and', 'but', 'or',
  'as', 'if', 'when', 'than', 'because', 'while', 'although', 'though',
  'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'i', 'me', 'my', 'mine', 'not', 'no', 'nor', 'so', 'yet', 'both',
  'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once',
]);
