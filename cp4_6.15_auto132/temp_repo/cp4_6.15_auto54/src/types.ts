export type Priority = 'high' | 'medium' | 'low';
export type Mood = 'happy' | 'calm' | 'sad' | 'angry' | 'surprised';

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  order: number;
}

export interface MoodEntry {
  date: string;
  mood: Mood;
  diary: string;
}

export interface SearchResult {
  type: 'task' | 'diary';
  id: string;
  title: string;
  snippet: string;
  matchStart: number;
  matchEnd: number;
}

export const MOOD_CONFIG: Record<Mood, { label: string; emoji: string; color: string; gradient: string }> = {
  happy: { label: '开心', emoji: '😊', color: '#F4BFBF', gradient: 'linear-gradient(135deg, #F4BFBF, #FF8E8E)' },
  calm: { label: '平静', emoji: '😌', color: '#98D8C8', gradient: 'linear-gradient(135deg, #98D8C8, #6BC5A8)' },
  sad: { label: '忧伤', emoji: '😢', color: '#A8C8F0', gradient: 'linear-gradient(135deg, #A8C8F0, #7BA7D9)' },
  angry: { label: '愤怒', emoji: '😤', color: '#F0A8A8', gradient: 'linear-gradient(135deg, #F0A8A8, #E06060)' },
  surprised: { label: '惊喜', emoji: '😲', color: '#D8B8F0', gradient: 'linear-gradient(135deg, #D8B8F0, #B880E0)' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; weight: number }> = {
  high: { label: '高', color: '#F0A0A0', weight: 3 },
  medium: { label: '中', color: '#F0D8A0', weight: 2 },
  low: { label: '低', color: '#A0D8C0', weight: 1 },
};
