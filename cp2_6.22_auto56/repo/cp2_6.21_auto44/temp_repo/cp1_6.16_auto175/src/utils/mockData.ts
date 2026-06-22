import { v4 as uuidv4 } from 'uuid';
import type { CityAQI } from '../types';

interface CityBase {
  city: string;
  lat: number;
  lng: number;
  baseAqi: number;
  trend: number;
  volatility: number;
}

const CITIES: CityBase[] = [
  { city: '北京', lat: 39.9042, lng: 116.4074, baseAqi: 120, trend: -4, volatility: 25 },
  { city: '上海', lat: 31.2304, lng: 121.4737, baseAqi: 85, trend: -2, volatility: 18 },
  { city: '东京', lat: 35.6762, lng: 139.6503, baseAqi: 55, trend: 1, volatility: 12 },
  { city: '首尔', lat: 37.5665, lng: 126.9780, baseAqi: 70, trend: -1, volatility: 20 },
  { city: '新德里', lat: 28.6139, lng: 77.2090, baseAqi: 200, trend: 5, volatility: 40 },
  { city: '伦敦', lat: 51.5074, lng: -0.1278, baseAqi: 45, trend: -1, volatility: 10 },
  { city: '巴黎', lat: 48.8566, lng: 2.3522, baseAqi: 55, trend: 0, volatility: 12 },
  { city: '柏林', lat: 52.5200, lng: 13.4050, baseAqi: 40, trend: -1, volatility: 10 },
  { city: '纽约', lat: 40.7128, lng: -74.0060, baseAqi: 65, trend: -2, volatility: 15 },
  { city: '洛杉矶', lat: 34.0522, lng: -118.2437, baseAqi: 90, trend: -3, volatility: 20 },
  { city: '墨西哥城', lat: 19.4326, lng: -99.1332, baseAqi: 140, trend: 2, volatility: 30 },
  { city: '圣保罗', lat: -23.5505, lng: -46.6333, baseAqi: 75, trend: 1, volatility: 18 },
  { city: '开罗', lat: 30.0444, lng: 31.2357, baseAqi: 160, trend: 4, volatility: 35 },
  { city: '悉尼', lat: -33.8688, lng: 151.2093, baseAqi: 35, trend: 1, volatility: 12 },
  { city: '莫斯科', lat: 55.7558, lng: 37.6173, baseAqi: 60, trend: -1, volatility: 15 },
];

export const generateMockCities = (): CityAQI[] => {
  const startYear = 2014;
  const endYear = 2023;

  return CITIES.map((c) => {
    const yearlyData = [];
    for (let year = startYear; year <= endYear; year++) {
      const yearOffset = year - startYear;
      const trendComponent = c.trend * yearOffset;
      const noise = (Math.sin(year * 12.9898 + c.lat * 78.233) * 43758.5453) % 1;
      const volatilityComponent = noise * c.volatility;
      const aqi = Math.max(
        10,
        Math.min(300, Math.round(c.baseAqi + trendComponent + volatilityComponent))
      );
      yearlyData.push({ year, aqi });
    }
    return {
      id: uuidv4(),
      city: c.city,
      lat: c.lat,
      lng: c.lng,
      yearlyData,
    };
  });
};
