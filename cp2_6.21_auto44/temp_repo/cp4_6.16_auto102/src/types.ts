export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'accessory';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Occasion = 'daily' | 'commute' | 'date' | 'sport';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  image: string;
  brand: string;
  color: string;
  seasons: Season[];
  material: string;
  purchaseDate: string;
  createdAt: number;
}

export interface Outfit {
  id: string;
  topId: string;
  bottomId: string;
  season: Season;
  occasion: Occasion;
  rating: number;
  createdAt: number;
}

export interface DailyLogEntry {
  id: string;
  outfitId: string;
  photo: string;
  note: string;
  weather: Weather;
  date: string;
  createdAt: number;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  outfitPhoto: string;
  likes: number;
  liked: boolean;
  createdAt: number;
  dailyLogId: string;
}
