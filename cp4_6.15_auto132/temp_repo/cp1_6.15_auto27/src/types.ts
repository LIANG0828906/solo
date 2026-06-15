export type PollutantType = 'PM2.5' | 'PM10' | 'O3' | 'NO2' | 'CO' | 'SO2';

export type AqiLevel = 'excellent' | 'good' | 'light' | 'moderate' | 'heavy' | 'severe';

export type TimeRange = '24h' | '7d' | '30d';

export type Theme = 'light' | 'dark';

export interface Station {
  id: string;
  name: string;
  city: string;
  aqi: number;
  level: AqiLevel;
  primaryPollutant: PollutantType;
  pollutants: Record<PollutantType, number>;
  updateTime: string;
}

export interface HistoryDataPoint {
  time: string;
  value: number;
}

export type HistoryData = Record<PollutantType, HistoryDataPoint[]>;

export const AQI_LEVELS: Record<AqiLevel, { label: string; color: string; min: number; max: number }> = {
  excellent: { label: '优', color: '#00E400', min: 0, max: 50 },
  good: { label: '良', color: '#FFFF00', min: 51, max: 100 },
  light: { label: '轻度污染', color: '#FF7E00', min: 101, max: 150 },
  moderate: { label: '中度污染', color: '#FF0000', min: 151, max: 200 },
  heavy: { label: '重度污染', color: '#99004C', min: 201, max: 300 },
  severe: { label: '严重污染', color: '#7E0023', min: 301, max: 500 },
};

export const POLLUTANT_UNITS: Record<PollutantType, string> = {
  'PM2.5': 'μg/m³',
  'PM10': 'μg/m³',
  'O3': 'μg/m³',
  'NO2': 'μg/m³',
  'CO': 'mg/m³',
  'SO2': 'μg/m³',
};

export const POLLUTANT_COLORS: Record<PollutantType, string> = {
  'PM2.5': '#1CB5B5',
  'PM10': '#FF7E00',
  'O3': '#00E400',
  'NO2': '#99004C',
  'CO': '#7E0023',
  'SO2': '#FFFF00',
};
