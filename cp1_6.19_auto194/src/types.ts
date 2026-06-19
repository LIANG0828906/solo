export interface Flower {
  id: string;
  name: string;
  color: string;
  meaning: string;
  icon: string;
  tags: EmotionTagType[];
}

export type EmotionTagType =
  | '浪漫'
  | '温暖'
  | '治愈'
  | '祝福'
  | '惊喜'
  | '清新'
  | '优雅'
  | '鼓励';

export interface EmotionTag {
  name: EmotionTagType;
  color: string;
  score: number;
}

export interface Bouquet {
  id: string;
  name: string;
  flowerIds: string[];
  thumbnailColors: string[];
  tags: EmotionTagType[];
}

export interface FlowerStore {
  flowers: Flower[];
  selectedFlowers: Flower[];
  emotionTags: EmotionTag[];
  recommendedBouquets: Bouquet[];
  activeTag: EmotionTagType | null;
  addFlower: (flower: Flower) => void;
  removeFlower: (flowerId: string) => void;
  reorderFlowers: (fromIndex: number, toIndex: number) => void;
  clearBouquet: () => void;
  calculateEmotionTags: () => void;
  generateRecommendations: () => void;
  setActiveTag: (tag: EmotionTagType | null) => void;
  applyBouquet: (bouquet: Bouquet) => void;
}
