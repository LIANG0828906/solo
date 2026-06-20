export type MoodType = 'happy' | 'calm' | 'excited' | 'sad' | 'angry' | 'anxious';

export type TagType = 'work' | 'family' | 'social' | 'exercise';

export interface MoodData {
  id: string;
  type: MoodType;
  intensity: number;
  description: string;
  tags: TagType[];
  timestamp: string;
}

export interface MoodConfig {
  color: string;
  label: string;
  hue: number;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  happy: { color: '#FFD93D', label: '开心', hue: 50 },
  calm: { color: '#6BCB77', label: '平静', hue: 128 },
  excited: { color: '#FF6B6B', label: '兴奋', hue: 0 },
  sad: { color: '#4D96FF', label: '悲伤', hue: 218 },
  angry: { color: '#FF8C42', label: '愤怒', hue: 25 },
  anxious: { color: '#9B59B6', label: '焦虑', hue: 282 },
};

export const TAG_LABELS: Record<TagType, string> = {
  work: '工作',
  family: '家庭',
  social: '社交',
  exercise: '运动',
};

export interface CalendarDay {
  date: string;
  moods: MoodData[];
  avgColor: string;
  avgIntensity: number;
}

export interface AnalysisData {
  emotionDistribution: Record<MoodType, number>;
  intensityTrend: { date: string; intensity: number }[];
  tagCorrelations: { tag: string; emotion: MoodType; count: number }[];
}

export interface ReportData {
  weekStart: string;
  weekEnd: string;
  insights: string[];
  recommendations: string[];
}
