import { v4 as uuidv4 } from 'uuid';

export const EMOJI_LIST: string[] = [
  '🎁', '🎈', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉', '💎', '👑',
  '🎯', '🎮', '📱', '💻', '⌚', '🎧', '🎤', '🎸', '🚗', '✈️',
  '🏠', '💰', '💳', '📦', '🔑', '🎨', '🎭', '🎪', '🎡', '🎢'
];

export const AVATAR_COLORS: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const RARITY_COLORS = {
  common: {
    bg: 'linear-gradient(135deg, #74b9ff, #0984e3)',
    border: '#0984e3'
  },
  rare: {
    bg: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
    border: '#6c5ce7'
  },
  legendary: {
    bg: 'linear-gradient(135deg, #fdcb6e, #f39c12)',
    border: '#f39c12'
  }
};

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function getRandomItem<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export function generateId(): string {
  return uuidv4();
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function animateNumber(
  from: number,
  to: number,
  duration: number,
  callback: (val: number) => void
): void {
  const startTime = performance.now();
  const diff = to - from;

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const currentValue = from + diff * easedProgress;
    callback(Math.round(currentValue));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
