import type { ProductType } from '@/types';

const typeColors: Record<ProductType, string> = {
  '精华': '#D4A5A5',
  '面霜': '#A5B5D4',
  '防晒': '#D4C9A5',
  '洁面': '#A5D4B5',
  '水乳': '#C9A5D4',
  '眼霜': '#D4B5A5',
  '面膜': '#B5D4A5',
  '其他': '#B5B5B5',
};

export const getTypeColor = (type: ProductType): string => {
  return typeColors[type] || typeColors['其他'];
};

export const getProgressGradient = (percent: number): string => {
  const startColor = { r: 129, g: 199, b: 132 };
  const endColor = { r: 229, g: 115, b: 115 };
  
  const ratio = percent / 100;
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * (1 - ratio));
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * (1 - ratio));
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * (1 - ratio));
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const generateSoftColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash % 360);
  const s = 30 + Math.abs(hash % 20);
  const l = 70 + Math.abs(hash % 10);
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};
