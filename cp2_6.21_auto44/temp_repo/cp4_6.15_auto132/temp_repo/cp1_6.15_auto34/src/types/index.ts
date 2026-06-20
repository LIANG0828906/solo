export interface Diary {
  id: string;
  title: string;
  content: string;
  images: string[];
  mood: string;
  locationId: string;
  locationName: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  diaryCount: number;
}

export interface SearchFilters {
  startDate?: string;
  endDate?: string;
  mood?: string;
  keyword?: string;
}

export const MOOD_OPTIONS = ['😊', '😄', '🥰', '😌', '🤩', '😎', '🥲', '😴', '🤔', '🌟'];
