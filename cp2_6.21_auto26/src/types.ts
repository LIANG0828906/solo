export type Mood = 'excited' | 'thoughtful' | 'bored' | 'anxious';

export interface Entry {
  id: string;
  title: string;
  source: string;
  summary: string;
  mood: Mood;
  createdAt: Date;
  updatedAt: Date;
}

export const MOOD_CONFIG: Record<Mood, { label: string; color: string }> = {
  excited: { label: '兴奋', color: '#ff6b6b' },
  thoughtful: { label: '沉思', color: '#4ecdc4' },
  bored: { label: '无聊', color: '#ffe66d' },
  anxious: { label: '焦虑', color: '#a29bfe' },
};
