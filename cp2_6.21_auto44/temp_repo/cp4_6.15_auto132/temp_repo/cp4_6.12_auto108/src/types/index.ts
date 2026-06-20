export type InterestTag = 'nature' | 'culture' | 'food' | 'shopping';

export type ThemeName = 'coast' | 'forest' | 'neon';

export interface Attraction {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  category: InterestTag;
  rating: number;
  openTime: string;
  stayDuration: number;
  thumbnail: string;
  photos: string[];
  description: string;
  cost: number;
}

export interface DayItineraryItem {
  attractionId: string;
  attraction: Attraction;
  startTime: string;
  endTime: string;
  commuteToNext: number;
}

export interface DayItinerary {
  day: number;
  date: string;
  items: DayItineraryItem[];
  totalDuration: number;
  totalCost: number;
}

export interface Itinerary {
  city: string;
  days: number;
  interests: InterestTag[];
  dayPlans: DayItinerary[];
  summary: {
    totalDuration: number;
    totalCost: number;
    totalAttractions: number;
  };
}

export interface GenerateItineraryRequest {
  city: string;
  days: number;
  interests: InterestTag[];
}

export interface RecalculateRequest {
  itinerary: Itinerary;
}

export interface ExportPdfRequest {
  itinerary: Itinerary;
}

export interface ExportPdfResponse {
  success: boolean;
  downloadUrl: string;
  filename: string;
}

export const INTEREST_LABELS: Record<InterestTag, string> = {
  nature: '自然风光',
  culture: '历史文化',
  food: '美食探索',
  shopping: '购物休闲',
};

export const CATEGORY_COLORS: Record<InterestTag, string> = {
  nature: '#4caf50',
  culture: '#ff9800',
  food: '#e91e63',
  shopping: '#2196f3',
};

export const CITIES = [
  '北京',
  '上海',
  '成都',
  '杭州',
  '西安',
  '厦门',
  '广州',
  '苏州',
];
