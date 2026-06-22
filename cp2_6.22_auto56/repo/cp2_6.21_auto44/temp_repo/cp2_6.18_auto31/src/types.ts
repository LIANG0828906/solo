export type MoodType = 'happy' | 'calm' | 'sad' | 'angry' | 'anxious' | 'surprised' | 'tired' | 'love';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  text: string;
  color: string;
  timestamp: number;
}

export interface MoodThemeInfo {
  color: string;
  gradientEnd: string;
  icon: string;
  label: string;
}

export type MoodTheme = Record<MoodType, MoodThemeInfo>;

export const MOOD_THEME: MoodTheme = {
  happy: {
    color: '#FF9F43',
    gradientEnd: '#FFD6A5',
    icon: '😊',
    label: '开心',
  },
  calm: {
    color: '#78C8A0',
    gradientEnd: '#A0D2EB',
    icon: '😌',
    label: '平静',
  },
  sad: {
    color: '#4C6B8A',
    gradientEnd: '#8B9FB5',
    icon: '😢',
    label: '悲伤',
  },
  angry: {
    color: '#E74C3C',
    gradientEnd: '#FF7675',
    icon: '😠',
    label: '愤怒',
  },
  anxious: {
    color: '#9B59B6',
    gradientEnd: '#BB8FCE',
    icon: '😰',
    label: '焦虑',
  },
  surprised: {
    color: '#F1C40F',
    gradientEnd: '#FFEAA7',
    icon: '😲',
    label: '惊讶',
  },
  tired: {
    color: '#7F8C8D',
    gradientEnd: '#BDC3C7',
    icon: '😴',
    label: '疲惫',
  },
  love: {
    color: '#E84393',
    gradientEnd: '#FD79A8',
    icon: '❤️',
    label: '爱',
  },
};

export const DEFAULT_GRADIENT = {
  start: '#FFD6A5',
  end: '#A0D2EB',
};
