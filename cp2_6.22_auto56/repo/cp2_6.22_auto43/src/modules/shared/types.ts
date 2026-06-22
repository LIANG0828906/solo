export type EmotionType = 'happy' | 'sad' | 'angry' | 'calm' | 'anxious' | 'surprised';

export interface EmotionConfig {
  emoji: string;
  color: string;
  label: string;
  intensity: number;
}

export interface EmotionRecord {
  id: string;
  emotion: EmotionType;
  tags: string[];
  note: string;
  timestamp: number;
  date: string;
}

export interface DailyEmotionSummary {
  date: string;
  avgIntensity: number;
  records: EmotionRecord[];
  dominantEmotion: EmotionType;
}

export interface MoodTrend {
  date: string;
  avgIntensity: number;
  emotionCounts: Record<EmotionType, number>;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'relaxation' | 'reflection' | 'activity';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
