export type ScentCategory = 'floral' | 'woody' | 'food' | 'environment';

export type EmotionTag = 'joyful' | 'nostalgic' | 'fresh' | 'oppressive';

export interface ScentMarker {
  id: string;
  lat: number;
  lng: number;
  date: string;
  description: string;
  category: ScentCategory;
  emotionTag: EmotionTag;
  color: string;
  recommendedColors: string[];
  pattern: string;
  poem: string;
  createdAt: Date;
}

export interface ColorTexture {
  colors: string[];
  pattern: string;
}

export interface ScentEntry {
  keywords: string[];
  category: ScentCategory;
  emotionTag: EmotionTag;
  colorTexture: ColorTexture;
}

export interface Filters {
  categories: ScentCategory[];
  emotions: EmotionTag[];
}

export interface PendingMarker {
  lat: number;
  lng: number;
}

export const EMOTION_COLORS: Record<EmotionTag, string> = {
  joyful: '#FF6B6B',
  nostalgic: '#F4A261',
  fresh: '#00D2FF',
  oppressive: '#6C5B7B',
};

export const CATEGORY_LABELS: Record<ScentCategory, string> = {
  floral: '花香',
  woody: '木质',
  food: '食物',
  environment: '环境',
};

export const EMOTION_LABELS: Record<EmotionTag, string> = {
  joyful: '愉悦',
  nostalgic: '怀旧',
  fresh: '清新',
  oppressive: '压抑',
};
