export type Emotion = 'joy' | 'nostalgia' | 'tension' | 'calm';

export interface Smell {
  id: string;
  name: string;
  description: string;
  color: string;
  emotion: Emotion;
  createdAt: string;
}

export type TabType = 'hall' | 'collection' | 'lab';

export const EMOTION_COLORS: Record<Emotion, string> = {
  joy: '#E74C3C',
  nostalgia: '#F39C12',
  tension: '#9B59B6',
  calm: '#1ABC9C'
};

export const EMOTION_NAMES: Record<Emotion, string> = {
  joy: '愉悦',
  nostalgia: '怀念',
  tension: '紧张',
  calm: '宁静'
};
