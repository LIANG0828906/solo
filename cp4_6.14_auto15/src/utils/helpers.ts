import type { Cuisine, Difficulty } from '../types';

const cuisineLabels: Record<Cuisine, string> = {
  chinese: '中餐',
  western: '西餐',
  japanese: '日料',
  korean: '韩餐',
  italian: '意餐',
  french: '法餐',
  other: '其他',
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const difficultyColors: Record<Difficulty, string> = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336',
};

const softColors = [
  '#FFD700',
  '#FFB6C1',
  '#87CEEB',
  '#98FB98',
  '#DDA0DD',
  '#F0E68C',
  '#FFA07A',
  '#20B2AA',
  '#D8BFD8',
  '#B0E0E6',
  '#FFE4B5',
  '#E6E6FA',
];

export function cuisineLabel(cuisine: Cuisine): string {
  return cuisineLabels[cuisine] || cuisineLabels.other;
}

export function difficultyLabel(difficulty: Difficulty): string {
  return difficultyLabels[difficulty];
}

export function difficultyColor(difficulty: Difficulty): string {
  return difficultyColors[difficulty];
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function randomAvatarColor(): string {
  const index = Math.floor(Math.random() * softColors.length);
  return softColors[index];
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
