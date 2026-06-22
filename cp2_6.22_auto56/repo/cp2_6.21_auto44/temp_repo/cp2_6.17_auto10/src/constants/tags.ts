import type { EmotionTag } from '@/types';

export const EMOTION_TAGS: EmotionTag[] = [
  { name: '温馨', category: 'warm' },
  { name: '炽热', category: 'warm' },
  { name: '欢快', category: 'warm' },
  { name: '热情', category: 'warm' },
  { name: '浪漫', category: 'warm' },
  
  { name: '宁静', category: 'cold' },
  { name: '忧郁', category: 'cold' },
  { name: '孤独', category: 'cold' },
  { name: '冷峻', category: 'cold' },
  { name: '沉静', category: 'cold' },
  { name: '深邃', category: 'cold' },
  { name: '空灵', category: 'cold' },
  { name: '凛冽', category: 'cold' },
  
  { name: '梦幻', category: 'mystery' },
  { name: '神秘', category: 'mystery' },
  { name: '迷幻', category: 'mystery' },
  { name: '诡异', category: 'mystery' },
  { name: '奇幻', category: 'mystery' },
  { name: '超现实', category: 'mystery' },
  { name: '朦胧', category: 'mystery' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  warm: '#FF8C00',
  cold: '#4682B4',
  mystery: '#9370DB',
};

export const MAX_TAGS_PER_WORK = 5;
