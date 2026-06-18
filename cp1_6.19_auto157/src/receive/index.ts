import { Bottle } from '@/context/GlobalState';

export function selectRandomBottle(bottles: Bottle[]): Bottle | null {
  const active = bottles.filter(b => !b.isArchived);
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
