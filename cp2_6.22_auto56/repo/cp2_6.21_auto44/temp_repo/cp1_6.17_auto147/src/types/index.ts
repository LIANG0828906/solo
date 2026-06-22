export type MoodType = 'very_happy' | 'happy' | 'neutral' | 'down' | 'terrible';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  mood: MoodType;
  title: string;
  content: string;
  tasks: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StatsData {
  date: string;
  avgMood: number | null;
  totalTasks: number;
  completedTasks: number;
  completedTaskList: {
    id: string;
    text: string;
    date: string;
    entryId: string;
  }[];
}

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; score: number; color: string }> = {
  very_happy: { emoji: '😄', label: '非常开心', score: 10, color: '#27AE60' },
  happy: { emoji: '😊', label: '开心', score: 8, color: '#2ECC71' },
  neutral: { emoji: '😐', label: '一般', score: 6, color: '#F1C40F' },
  down: { emoji: '😔', label: '低落', score: 4, color: '#E67E22' },
  terrible: { emoji: '😢', label: '糟糕', score: 2, color: '#E74C3C' }
};
