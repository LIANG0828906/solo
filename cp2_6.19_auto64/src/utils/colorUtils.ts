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
  const green = { r: 129, g: 199, b: 132 };
  const yellow = { r: 255, g: 213, b: 79 };
  const red = { r: 229, g: 115, b: 115 };
  
  let color;
  if (percent >= 50) {
    const ratio = (percent - 50) / 50;
    color = {
      r: Math.round(yellow.r + (green.r - yellow.r) * ratio),
      g: Math.round(yellow.g + (green.g - yellow.g) * ratio),
      b: Math.round(yellow.b + (green.b - yellow.b) * ratio),
    };
  } else {
    const ratio = percent / 50;
    color = {
      r: Math.round(red.r + (yellow.r - red.r) * ratio),
      g: Math.round(red.g + (yellow.g - red.g) * ratio),
      b: Math.round(red.b + (yellow.b - red.b) * ratio),
    };
  }
  
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
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
