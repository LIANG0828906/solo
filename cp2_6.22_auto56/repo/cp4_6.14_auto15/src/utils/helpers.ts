import type { Cuisine, Difficulty } from '../types';

export function cuisineLabel(c: Cuisine | string): string {
  const map: Record<string, string> = {
    chinese: '中餐', western: '西餐', japanese: '日料',
    korean: '韩餐', italian: '意餐', french: '法餐', other: '其他',
  };
  return map[c] || c;
}

export function difficultyLabel(d: Difficulty | string): string {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  return map[d] || d;
}

export function difficultyColor(d: Difficulty | string): string {
  const map: Record<string, string> = {
    easy: '#4CAF50', medium: '#FF9800', hard: '#F44336',
  };
  return map[d] || '#999';
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

const avatarColors = [
  '#FFB74D', '#81C784', '#64B5F6', '#BA68C8', '#F06292',
  '#4DB6AC', '#FF8A65', '#A1887F', '#90A4AE', '#FFD54F',
];

export function randomAvatarColor(): string {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)];
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
