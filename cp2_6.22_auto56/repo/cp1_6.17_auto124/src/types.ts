export type SoundType = 'rain' | 'traffic' | 'bird' | 'wind' | 'voice';

export interface SoundSample {
  id: string;
  lat: number;
  lng: number;
  name: string;
  soundType: SoundType;
  recordedAt: string;
  volume: number;
  description: string;
}

export interface RoutePoint {
  sampleId: string;
  order: number;
}

export interface SoundRoute {
  id: string;
  points: RoutePoint[];
  totalDistance: number;
}

export interface SoundIconMap {
  [key in SoundType]: string;
}

export const SOUND_TYPE_COLORS: Record<SoundType, string> = {
  rain: '#0984E3',
  traffic: '#FDCB6E',
  bird: '#00B894',
  wind: '#6C5CE7',
  voice: '#E17055',
};

export const SOUND_TYPE_EMOJI: Record<SoundType, string> = {
  rain: '🌧️',
  traffic: '🚗',
  bird: '🐦',
  wind: '💨',
  voice: '🗣️',
};

export const SOUND_TYPE_LABELS: Record<SoundType, string> = {
  rain: '雨声',
  traffic: '车流',
  bird: '鸟鸣',
  wind: '风声',
  voice: '人声',
};
