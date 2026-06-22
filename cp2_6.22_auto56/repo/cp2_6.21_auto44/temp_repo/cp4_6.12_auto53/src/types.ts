export interface TravelEntry {
  id: string;
  date: string;
  location: string;
  lat: number;
  lng: number;
  content: string;
  photos: string[];
  createdAt: number;
}
