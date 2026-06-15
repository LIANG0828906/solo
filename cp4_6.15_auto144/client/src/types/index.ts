export interface FoodJournal {
  id: string;
  restaurantName: string;
  photos: string[];
  cuisineTags: string[];
  rating: number;
  review: string;
  latitude: number;
  longitude: number;
  tasteProfile: TasteProfile;
  createdAt: string;
}

export interface TasteProfile {
  sour: number;
  sweet: number;
  spicy: number;
  salty: number;
  umami: number;
}

export interface CreateJournalDto {
  restaurantName: string;
  photos: string[];
  cuisineTags: string[];
  rating: number;
  review: string;
  latitude: number;
  longitude: number;
  tasteProfile: TasteProfile;
}

export interface RadarData {
  sour: number;
  sweet: number;
  spicy: number;
  salty: number;
  umami: number;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export type CuisineTag = '中餐' | '日料' | '西餐' | '韩餐' | '泰餐' | '甜品' | '其他';

export const CUISINE_TAGS: CuisineTag[] = ['中餐', '日料', '西餐', '韩餐', '泰餐', '甜品', '其他'];
