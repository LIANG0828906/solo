export type MoodType = 'happy' | 'sad' | 'angry' | 'calm' | 'anxious';

export interface SculptureData {
  id: string;
  mood: MoodType;
  intensity: number;
  createdAt: Date;
  baseRadius: number;
  position: { x: number; y: number; z: number };
  isOnShelf: boolean;
}

export const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#FFD93D',
  sad: '#4D96FF',
  angry: '#FF6B6B',
  calm: '#6BCB77',
  anxious: '#9B59B6'
};

export const MOOD_LABELS: Record<MoodType, string> = {
  happy: '快乐',
  sad: '悲伤',
  angry: '愤怒',
  calm: '平静',
  anxious: '焦虑'
};

export const MOOD_SHAPES: Record<MoodType, 'sphere' | 'teardrop' | 'spike' | 'torus' | 'icosahedron'> = {
  happy: 'sphere',
  sad: 'teardrop',
  angry: 'spike',
  calm: 'torus',
  anxious: 'icosahedron'
};
