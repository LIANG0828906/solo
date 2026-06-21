import { v4 as uuidv4 } from 'uuid';
import type { Chapter, Transition, TransitionType } from '../../types';

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function generateMockChapters(duration: number): Chapter[] {
  if (duration <= 0) return [];
  const chapters: Chapter[] = [];
  const avgChunk = Math.min(duration / 4, 120);
  let time = 0;
  let idx = 1;
  while (time < duration - 5) {
    const jitter = (Math.random() - 0.5) * avgChunk * 0.3;
    const segment = Math.max(30, avgChunk + jitter);
    const start = Math.min(time, duration - 2);
    chapters.push({
      id: uuidv4(),
      index: idx++,
      startTime: Math.round(start * 100) / 100,
      title: `章节 ${idx - 1}`,
    });
    time = start + segment;
  }
  return chapters;
}

export const TRANSITION_LABELS: Record<string, string> = {
  fade: '淡入淡出',
  flip: '翻页',
  zoom: '缩放',
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
