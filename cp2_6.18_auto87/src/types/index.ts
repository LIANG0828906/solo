export interface City {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export interface HistoryEvent {
  year: string;
  title: string;
  description: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  avatarGradient: string;
  rating: number;
  content: string;
  timestamp: number;
}

export interface Landmark {
  id: string;
  cityId: string;
  name: string;
  description: string;
  imageUrl: string;
  position: [number, number];
  history: HistoryEvent[];
  reviews: Review[];
}

export type SortType = 'time' | 'rating';
