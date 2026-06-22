export type Mood = 'happy' | 'calm' | 'melancholy' | 'angry' | 'surprised';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: Point[];
}

export interface DrawingRecord {
  id: string;
  timestamp: number;
  mood: Mood;
  strokes: Stroke[];
  isFavorite: boolean;
  favoritedAt?: number;
}

export const MOOD_LABELS: Record<Mood, string> = {
  happy: '开心',
  calm: '平静',
  melancholy: '忧郁',
  angry: '愤怒',
  surprised: '惊喜'
};

export const MOOD_COLORS: Record<Mood, string> = {
  happy: '#FFD700',
  calm: '#4A90D9',
  melancholy: '#9B59B6',
  angry: '#E74C3C',
  surprised: '#FF69B4'
};

export const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9'
];

export const BRUSH_SIZES = [3, 6, 10];
