export type LightRequirement = 'shade' | 'indirect' | 'sunny';

export type WateringFrequency = 'daily' | 'every2days' | 'weekly' | 'custom';

export type RecordType = 'water' | 'repot' | 'fertilize' | 'photo';

export interface PlantPhoto {
  id: string;
  url: string;
  date: string;
  note?: string;
}

export interface GrowthRecord {
  id: string;
  type: RecordType;
  date: string;
  note?: string;
  photoUrl?: string;
}

export interface Plant {
  id: string;
  name: string;
  species?: string;
  wateringFrequency: WateringFrequency;
  customDays?: number;
  lightRequirement: LightRequirement;
  photos: PlantPhoto[];
  growthRecords: GrowthRecord[];
  lastWateredAt?: string;
  nextWateringAt?: string;
  createdAt: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  precipitation: number;
  humidity: number;
  timestamp: number;
}

export interface Reminder {
  id: string;
  plantId: string;
  remindAt: string;
  isActive: boolean;
}

export type AppView = 'home' | 'detail';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface WateringReminder {
  plantId: string;
  plantName: string;
}
