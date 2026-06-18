import { Emotion } from '@/eventBus';

export interface BottlePayload {
  id: string;
  text: string;
  emotion: Emotion;
  createdAt: number;
}

export const EMOTION_LABELS: Record<Emotion, string> = {
  happy: '快乐',
  sad: '悲伤',
  think: '思考',
  surprise: '惊奇',
};

export const EMOTION_COLORS: Record<Emotion, string> = {
  happy: '#FFD700',
  sad: '#4A90D9',
  think: '#2ECC71',
  surprise: '#9B59B6',
};

export const EMOTIONS: Emotion[] = ['happy', 'sad', 'think', 'surprise'];

export function createBottle(text: string, emotion: Emotion): BottlePayload {
  return {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    emotion,
    createdAt: Date.now(),
  };
}
