export interface Trip {
  id: string;
  name: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  tripId: string;
  dataUrl: string;
  fileName: string;
  captureTime: string;
  latitude: number | null;
  longitude: number | null;
  cityName: string;
  weather: 'sunny' | 'cloudy' | 'rainy';
}

export type Weather = 'sunny' | 'cloudy' | 'rainy';

export interface DayGroup {
  date: string;
  photos: Photo[];
}
