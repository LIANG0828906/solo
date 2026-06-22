import axios from 'axios';

export interface City {
  id: string;
  name: string;
  icon: string;
}

export interface CurrentAirData {
  cityId: string;
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  timestamp: string;
}

export interface HistoryDataPoint {
  timestamp: string;
  value: number;
}

export interface HistoryData {
  cityId: string;
  pm25: HistoryDataPoint[];
  pm10: HistoryDataPoint[];
  ozone: HistoryDataPoint[];
  no2: HistoryDataPoint[];
}

const api = axios.create({
  baseURL: '/api',
  timeout: 1000,
});

export const airApi = {
  async getCities(): Promise<City[]> {
    const response = await api.get('/cities');
    return response.data.cities;
  },

  async getAllCurrent(): Promise<CurrentAirData[]> {
    const response = await api.get('/current');
    return response.data.data;
  },

  async getCurrent(cityId: string): Promise<CurrentAirData> {
    const response = await api.get(`/current/${cityId}`);
    return response.data;
  },

  async getHistory(cityId: string): Promise<HistoryData> {
    const response = await api.get(`/history/${cityId}`);
    return response.data;
  },
};

export type PollutantKey = 'pm25' | 'pm10' | 'ozone' | 'no2';

export const POLLUTANT_CONFIG: Record<PollutantKey, { name: string; unit: string; max: number }> = {
  pm25: { name: 'PM2.5', unit: 'μg/m³', max: 250 },
  pm10: { name: 'PM10', unit: 'μg/m³', max: 400 },
  ozone: { name: '臭氧', unit: 'μg/m³', max: 300 },
  no2: { name: '二氧化氮', unit: 'μg/m³', max: 200 },
};

export function getAqiLevel(aqi: number): { level: string; color: string } {
  if (aqi <= 50) return { level: '优', color: '#00e400' };
  if (aqi <= 100) return { level: '良', color: '#ffff00' };
  if (aqi <= 150) return { level: '轻度污染', color: '#ff7e00' };
  if (aqi <= 200) return { level: '中度污染', color: '#ff0000' };
  return { level: '重度污染', color: '#99004c' };
}

export function getPollutantColor(key: PollutantKey, value: number): string {
  const max = POLLUTANT_CONFIG[key].max;
  const ratio = value / max;
  if (ratio <= 0.3) return '#00e400';
  if (ratio <= 0.5) return '#ffff00';
  if (ratio <= 0.7) return '#ff7e00';
  if (ratio <= 0.9) return '#ff0000';
  return '#99004c';
}
