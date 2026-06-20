export type LightPreference = '喜阳' | '半阴' | '喜阴';

export type CareType = 'watering' | 'fertilizing' | 'repotting' | 'soilLoosening';

export type ReminderType = 'watering' | 'fertilizing' | 'repotting' | 'soilLoosening';

export type ReminderStatus = 'pending' | 'delayed' | 'completed';

export interface SpeciesPreset {
  name: string;
  wateringInterval: number;
  lightPreference: LightPreference;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  photoUrl: string;
  purchaseDate: string;
  location: string;
  isFavorite: boolean;
  lightPreference: LightPreference;
  wateringInterval: number;
  lastWateringDate?: string;
  lastFertilizingDate?: string;
  lastRepottingDate?: string;
  lastSoilLooseningDate?: string;
}

export interface CareRecord {
  id: string;
  plantId: string;
  type: CareType;
  date: string;
  note?: string;
}

export interface WeatherData {
  temperature: number;
  forecast: { day: number; rainProbability: number }[];
}

export interface Reminder {
  id: string;
  plantId: string;
  type: ReminderType;
  dueDate: string;
  status: ReminderStatus;
  daysLeft: number;
  delayedByWeather?: boolean;
}

export const SPECIES_PRESETS: SpeciesPreset[] = [
  { name: '熊童子', wateringInterval: 10, lightPreference: '喜阳' },
  { name: '玉露', wateringInterval: 14, lightPreference: '半阴' },
  { name: '生石花', wateringInterval: 30, lightPreference: '喜阳' },
  { name: '黑法师', wateringInterval: 12, lightPreference: '喜阳' },
  { name: '静夜', wateringInterval: 10, lightPreference: '喜阳' },
  { name: '雪莲', wateringInterval: 15, lightPreference: '半阴' },
  { name: '姬玉露', wateringInterval: 14, lightPreference: '半阴' },
  { name: '火祭', wateringInterval: 7, lightPreference: '喜阳' },
  { name: '蓝石莲', wateringInterval: 12, lightPreference: '喜阳' },
  { name: '吉娃娃', wateringInterval: 10, lightPreference: '喜阳' }
];

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  watering: '浇水',
  fertilizing: '施肥',
  repotting: '换盆',
  soilLoosening: '翻土'
};

export const CARE_TYPE_COLORS: Record<CareType, string> = {
  watering: '#4A90D9',
  fertilizing: '#5CB85C',
  repotting: '#F0AD4E',
  soilLoosening: '#999999'
};
