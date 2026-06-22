export type MoodType = 'happy' | 'calm' | 'anxious' | 'sad' | 'angry';

export type DietLabel = 'high_sugar' | 'high_salt' | 'healthy' | 'light' | 'spicy';

export interface MoodEntry {
  id: string;
  date: string;
  mood: MoodType;
  intensity: number;
  sleepHours: number;
  exerciseMinutes: number;
  waterCups: number;
  dietLabels: DietLabel[];
}

export interface FilterOptions {
  exerciseMoreThan30?: boolean;
  sleepLessThan6?: boolean;
  highSugar?: boolean;
  highSalt?: boolean;
  healthyDiet?: boolean;
  lightDiet?: boolean;
  spicyDiet?: boolean;
}

export interface StatResult {
  filteredAvg: number;
  filteredStd: number;
  overallAvg: number;
  overallStd: number;
  filteredCount: number;
  totalCount: number;
}

export interface CorrelationResult {
  sleepHours: number;
  exerciseMinutes: number;
  waterCups: number;
}

export const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  anxious: '焦虑',
  sad: '悲伤',
  angry: '愤怒',
};

export const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  anxious: '😰',
  sad: '😢',
  angry: '😠',
};

export const DIET_LABELS: Record<DietLabel, string> = {
  high_sugar: '高糖',
  high_salt: '高盐',
  healthy: '健康',
  light: '清淡',
  spicy: '辛辣',
};
