export type Category = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface IItem {
  id: string;
  name: string;
  category: Category;
  color: string;
  seasons: Season[];
  photo: string;
  purchaseDate: string;
  price: number;
  wearFrequency: {
    weekly: number;
    monthly: number;
    yearly: number;
    total: number;
  };
}

export interface IOutfit {
  id: string;
  itemIds: string[];
  harmonyScore: number;
  note: string;
  date: string;
  itemWearCounts: Record<string, number>;
}

export interface IWardrobeStats {
  totalSpent: number;
  itemCount: number;
  averagePrice: number;
}

export const COLOR_PALETTE: Record<string, string> = {
  red: '#FF0000',
  orange: '#FFA500',
  yellow: '#FFFF00',
  lime: '#00FF00',
  green: '#008000',
  teal: '#008080',
  cyan: '#00FFFF',
  blue: '#0000FF',
  navy: '#000080',
  purple: '#800080',
  magenta: '#FF00FF',
  pink: '#FFC0CB',
  brown: '#8B4513',
  white: '#FFFFFF',
  gray: '#808080',
  black: '#000000',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  top: '上衣',
  bottom: '下装',
  outer: '外套',
  shoes: '鞋子',
  accessory: '配饰',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};
