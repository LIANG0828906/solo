export enum MoodType {
  HAPPY = 'happy',
  CALM = 'calm',
  SAD = 'sad',
  ANGRY = 'angry',
  ANXIOUS = 'anxious',
  TIRED = 'tired',
}

export interface MoodRecord {
  id: string;
  userId: string;
  mood: MoodType;
  text: string;
  date: string;
  intensity: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface MoodData {
  users: User[];
  moods: MoodRecord[];
}

export const MOOD_META: Record<MoodType, { emoji: string; label: string; weather: string; weatherIcon: string; color: string; bg: string }> = {
  [MoodType.HAPPY]: { emoji: '😊', label: '开心', weather: '晴', weatherIcon: '☀️', color: '#FF9800', bg: '#FFF8E1' },
  [MoodType.CALM]: { emoji: '😌', label: '平静', weather: '多云', weatherIcon: '⛅', color: '#66BB6A', bg: '#E8F5E9' },
  [MoodType.SAD]: { emoji: '😢', label: '忧伤', weather: '小雨', weatherIcon: '🌧️', color: '#42A5F5', bg: '#E3F2FD' },
  [MoodType.ANGRY]: { emoji: '😠', label: '愤怒', weather: '雷阵雨', weatherIcon: '⛈️', color: '#EF5350', bg: '#FFEBEE' },
  [MoodType.ANXIOUS]: { emoji: '😰', label: '焦虑', weather: '雾霾', weatherIcon: '🌫️', color: '#FFA726', bg: '#FFF3E0' },
  [MoodType.TIRED]: { emoji: '😫', label: '疲惫', weather: '阴', weatherIcon: '☁️', color: '#78909C', bg: '#ECEFF1' },
};
