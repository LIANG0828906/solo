export interface ReadingGoal {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  category: string;
  totalPages: number;
  currentPage: number;
  deadline: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingRecord {
  id: string;
  goalId: string;
  startPage: number;
  endPage: number;
  duration: number;
  date: string;
  mood: string;
  customTags: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  goalId: string;
  page: number;
  highlightText: string;
  annotation: string;
  createdAt: string;
}

export type SortType = 'page' | 'time';

export type TimeRange = 'week' | 'month';

export interface ReminderToastData {
  goalId: string;
  title: string;
  suggestedPages: number;
  completedPages: number;
}

export const CATEGORY_GRADIENTS: Record<string, string> = {
  '科幻': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '文学': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  '历史': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  '哲学': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  '技术': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  '经济': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  '艺术': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  '其他': 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
};

export const MOOD_COLORS: Record<string, string> = {
  '专注': '#4CAF50',
  '困倦': '#9E9E9E',
  '兴奋': '#FF9800',
  '愉悦': '#E91E63',
  '沉思': '#2196F3',
  '无聊': '#795548',
};

export const DEFAULT_MOODS = ['专注', '困倦', '兴奋', '愉悦', '沉思', '无聊'];
