export enum Category {
  Work = 'work',
  Learning = 'learning',
  Life = 'life',
  Sport = 'sport',
  Social = 'social',
  Other = 'other'
}

export type ViewType = 'day' | 'week' | 'statistics';

export interface TimeBlock {
  id: string;
  startTime: number;
  endTime: number;
  category: Category;
  color: string;
  name: string;
  note: string;
  date: string;
}

export interface DailyGoal {
  id: string;
  category: Category;
  targetMinutes: number;
  color: string;
}

export interface WeeklyStats {
  dates: string[];
  categoryTotals: Record<Category, number>;
  dailyData: Array<{ date: string; label: string; [key: string]: number | string }>;
}

export interface GoalProgress {
  goal: DailyGoal;
  completed: number;
  percentage: number;
}

export const COLOR_PALETTE: string[] = [
  '#9B59B6',
  '#2ECC71',
  '#E67E22',
  '#3498DB',
  '#E74C3C',
  '#1ABC9C',
  '#F39C12',
  '#95A5A6',
  '#34495E',
  '#16A085'
];

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.Work]: '工作',
  [Category.Learning]: '学习',
  [Category.Life]: '生活',
  [Category.Sport]: '运动',
  [Category.Social]: '社交',
  [Category.Other]: '其他'
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.Work]: '#3498DB',
  [Category.Learning]: '#9B59B6',
  [Category.Life]: '#2ECC71',
  [Category.Sport]: '#E74C3C',
  [Category.Social]: '#E67E22',
  [Category.Other]: '#95A5A6'
};
