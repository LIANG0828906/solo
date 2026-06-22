import type { Mood, MoodId } from '@/types';

export const moods: Record<MoodId, Mood> = {
  happy: {
    id: 'happy',
    name: '开心',
    emoji: '�',
    color: '#FF6B6B',
  },
  touched: {
    id: 'touched',
    name: '感动',
    emoji: '😢',
    color: '#4ECDC4',
  },
  surprised: {
    id: 'surprised',
    name: '惊喜',
    emoji: '🎉',
    color: '#FFD93D',
  },
  warm: {
    id: 'warm',
    name: '温馨',
    emoji: '🏠',
    color: '#6BCB77',
  },
  funny: {
    id: 'funny',
    name: '有趣',
    emoji: '�',
    color: '#A29BFE',
  },
};

export const moodList: Mood[] = Object.values(moods);

export function getMood(id: MoodId): Mood {
  return moods[id] || moods.happy;
}
