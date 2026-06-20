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
  excited: { label: '兴奋', color: '#FF6B6B' },
  thoughtful: { label: '深思', color: '#4ECDC4' },
  bored: { label: '无聊', color: '#95E1D3' },
  anxious: { label: '焦虑', color: '#DDA0DD' },
};
