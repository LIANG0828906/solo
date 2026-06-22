export interface Work {
  id: string;
  title: string;
  cover: string;
  tags: string[];
  story: string;
  createdAt: number;
}

export type EmotionCategory = 'warm' | 'cold' | 'mystery';

export interface EmotionTag {
  name: string;
  category: EmotionCategory;
}

export interface TagNode {
  id: string;
  name: string;
  category: EmotionCategory;
  value: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface TagLink {
  source: string;
  target: string;
  value: number;
}
