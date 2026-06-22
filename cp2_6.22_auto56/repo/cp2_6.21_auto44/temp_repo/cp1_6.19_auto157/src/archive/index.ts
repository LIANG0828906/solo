import { Bottle } from '@/context/GlobalState';
import { Emotion } from '@/eventBus';

export function getArchivedBottles(bottles: Bottle[]): Bottle[] {
  return bottles.filter(b => b.isArchived);
}

export function filterByEmotion(bottles: Bottle[], emotion: Emotion | 'all'): Bottle[] {
  if (emotion === 'all') return bottles;
  return bottles.filter(b => b.emotion === emotion);
}

export function filterByTimeRange(bottles: Bottle[], start: number, end: number): Bottle[] {
  return bottles.filter(b => b.createdAt >= start && b.createdAt <= end);
}
