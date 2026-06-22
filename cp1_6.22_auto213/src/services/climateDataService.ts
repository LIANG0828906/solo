export interface CityClimateData {
  id: string;
  name: string;
  nameCN: string;
  lat: number;
  lng: number;
  monthlyData: MonthlyClimateData[];
  color: string;
}

export interface MonthlyClimateData {
  month: number;
  temperature: number;
  precipitation: number;
  humidity: number;
}

const CITIES_DATA: CityClimateData[] = [
  {
    id: 'newyork',
    name: 'New York',
    nameCN: '纽约',
    lat: 40.7128,
    lng: -74.006,
    color: '#FF6B6B',
    monthlyData: [
      { month: 1, temperature: 0.5, precipitation: 85, humidity: 65 },
      { month: 2, temperature: 2.2, precipitation: 80, humidity: 62 },
      { month: 3, temperature: 6.8, precipitation: 95, humidity: 60 },
      { month: 4, temperature: 12.5, precipitation: 100, humidity: 63 },
      { month: 5, temperature: 18.3, precipitation: 105, humidity: 68 },
      { month: 6, temperature: 23.4, precipitation: 100, humidity: 72 },
      { month: 7, temperature: 26.1, precipitation: 110, humidity: 75 },
      { month: 8, temperature: 25.2, precipitation: 105, humidity: 75 },
      { month: 9, temperature: 21.0, precipitation: 95, humidity: 72 },
      { month: 10, temperature: 14.8, precipitation: 90, humidity: 68 },
      { month: 11, temperature: 8.9, precipitation: 95, humidity: 66 },
      { month: 12, temperature: 2.8, precipitation: 90, humidity: 65 }
    ]
  },
  {
    id: 'london',
    name: 'London',
    nameCN: '伦敦',
    lat: 51.5074,
    lng: -0.1278,
    color: '#4ECDC4',
    monthlyData: [
      { month: 1, temperature: 4.8, precipitation: 55, humidity: 82 },
      { month: 2, temperature: 5.2, precipitation: 45, humidity: 80 },
      { month: 3, temperature: 7.8, precipitation: 50, humidity: 76 },
      { month: 4, temperature: 10.8, precipitation: 55, humidity: 72 },
      { month: 5, temperature: 14.2, precipitation: 60, humidity: 70 },
      { month: 6, temperature: 17.2, precipitation: 55, humidity: 68 },
      { month: 7, temperature: 19.5, precipitation: 50, humidity: 66 },
      { month: 8, temperature: 19.2, precipitation: 55, humidity: 68 },
      { month: 9, temperature: 16.5, precipitation: 60, humidity: 72 },
      { month: 10, temperature: 12.2, precipitation: 70, humidity: 78 },
      { month: 11, temperature: 8.0, precipitation: 65, humidity: 82 },
      { month: 12, temperature: 5.5, precipitation: 60, humidity: 84 }
    ]
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    nameCN: '东京',
    lat: 35.6762,
    lng: 139.6503,
    color: '#A78BFA',
    monthlyData: [
      { month: 1, temperature: 5.4, precipitation: 50, humidity: 58 },
      { month: 2, temperature: 6.2, precipitation: 60, humidity: 60 },
      { month: 3, temperature: 9.7, precipitation: 110, humidity: 65 },
      { month: 4, temperature: 14.8, precipitation: 130, humidity: 70 },
      { month: 5, temperature: 19.5, precipitation: 140, humidity: 75 },
      { month: 6, temperature: 22.8, precipitation: 180, humidity: 82 },
      { month: 7, temperature: 26.4, precipitation: 160, humidity: 85 },
      { month: 8, temperature: 27.8, precipitation: 155, humidity: 84 },
      { month: 9, temperature: 24.1, precipitation: 210, humidity: 80 },
      { month: 10, temperature: 18.5, precipitation: 180, humidity: 72 },
      { month: 11, temperature: 12.8, precipitation: 100, humidity: 65 },
      { month: 12, temperature: 7.6, precipitation: 60, humidity: 60 }
    ]
  },
  {
    id: 'sydney',
    name: 'Sydney',
    nameCN: '悉尼',
    lat: -33.8688,
    lng: 151.2093,
    color: '#FBBF24',
    monthlyData: [
      { month: 1, temperature: 23.5, precipitation: 105, humidity: 70 },
      { month: 2, temperature: 23.4, precipitation: 115, humidity: 72 },
      { month: 3, temperature: 21.8, precipitation: 130, humidity: 73 },
      { month: 4, temperature: 18.8, precipitation: 125, humidity: 70 },
      { month: 5, temperature: 15.2, precipitation: 120, humidity: 68 },
      { month: 6, temperature: 12.5, precipitation: 125, humidity: 65 },
      { month: 7, temperature: 11.8, precipitation: 95, humidity: 63 },
      { month: 8, temperature: 13.0, precipitation: 85, humidity: 62 },
      { month: 9, temperature: 15.5, precipitation: 70, humidity: 62 },
      { month: 10, temperature: 18.2, precipitation: 80, humidity: 65 },
      { month: 11, temperature: 20.5, precipitation: 95, humidity: 68 },
      { month: 12, temperature: 22.5, precipitation: 85, humidity: 70 }
    ]
  },
  {
    id: 'capetown',
    name: 'Cape Town',
    nameCN: '开普敦',
    lat: -33.9249,
    lng: 18.4241,
    color: '#F472B6',
    monthlyData: [
      { month: 1, temperature: 22.2, precipitation: 15, humidity: 60 },
      { month: 2, temperature: 22.4, precipitation: 20, humidity: 62 },
      { month: 3, temperature: 21.0, precipitation: 25, humidity: 65 },
      { month: 4, temperature: 18.5, precipitation: 50, humidity: 72 },
      { month: 5, temperature: 15.8, precipitation: 85, humidity: 78 },
      { month: 6, temperature: 13.5, precipitation: 95, humidity: 82 },
      { month: 7, temperature: 12.8, precipitation: 90, humidity: 80 },
      { month: 8, temperature: 13.2, precipitation: 80, humidity: 78 },
      { month: 9, temperature: 14.8, precipitation: 50, humidity: 72 },
      { month: 10, temperature: 17.2, precipitation: 35, humidity: 65 },
      { month: 11, temperature: 19.5, precipitation: 20, humidity: 62 },
      { month: 12, temperature: 21.5, precipitation: 15, humidity: 60 }
    ]
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    nameCN: '里约热内卢',
    lat: -22.9068,
    lng: -43.1729,
    color: '#34D399',
    monthlyData: [
      { month: 1, temperature: 26.5, precipitation: 155, humidity: 78 },
      { month: 2, temperature: 26.8, precipitation: 140, humidity: 78 },
      { month: 3, temperature: 26.0, precipitation: 135, humidity: 78 },
      { month: 4, temperature: 24.2, precipitation: 95, humidity: 75 },
      { month: 5, temperature: 21.8, precipitation: 85, humidity: 72 },
      { month: 6, temperature: 20.2, precipitation: 55, humidity: 70 },
      { month: 7, temperature: 19.5, precipitation: 50, humidity: 68 },
      { month: 8, temperature: 20.0, precipitation: 55, humidity: 68 },
      { month: 9, temperature: 21.2, precipitation: 65, humidity: 70 },
      { month: 10, temperature: 22.8, precipitation: 85, humidity: 73 },
      { month: 11, temperature: 24.2, precipitation: 110, humidity: 76 },
      { month: 12, temperature: 25.8, precipitation: 135, humidity: 78 }
    ]
  },
  {
    id: 'dubai',
    name: 'Dubai',
    nameCN: '迪拜',
    lat: 25.2048,
    lng: 55.2708,
    color: '#FB923C',
    monthlyData: [
      { month: 1, temperature: 19.5, precipitation: 10, humidity: 55 },
      { month: 2, temperature: 20.5, precipitation: 15, humidity: 52 },
      { month: 3, temperature: 23.5, precipitation: 15, humidity: 48 },
      { month: 4, temperature: 27.8, precipitation: 8, humidity: 42 },
      { month: 5, temperature: 32.2, precipitation: 2, humidity: 35 },
      { month: 6, temperature: 34.8, precipitation: 0, humidity: 32 },
      { month: 7, temperature: 36.2, precipitation: 0, humidity: 35 },
      { month: 8, temperature: 36.0, precipitation: 0, humidity: 40 },
      { month: 9, temperature: 33.5, precipitation: 0, humidity: 45 },
      { month: 10, temperature: 29.8, precipitation: 2, humidity: 50 },
      { month: 11, temperature: 25.2, precipitation: 5, humidity: 55 },
      { month: 12, temperature: 21.0, precipitation: 10, humidity: 58 }
    ]
  },
  {
    id: 'shanghai',
    name: 'Shanghai',
    nameCN: '上海',
    lat: 31.2304,
    lng: 121.4737,
    color: '#60A5FA',
    monthlyData: [
      { month: 1, temperature: 4.8, precipitation: 55, humidity: 72 },
      { month: 2, temperature: 6.5, precipitation: 65, humidity: 74 },
      { month: 3, temperature: 10.2, precipitation: 100, humidity: 74 },
      { month: 4, temperature: 15.8, precipitation: 115, humidity: 72 },
      { month: 5, temperature: 21.0, precipitation: 130, humidity: 70 },
      { month: 6, temperature: 25.0, precipitation: 185, humidity: 78 },
      { month: 7, temperature: 29.2, precipitation: 160, humidity: 82 },
      { month: 8, temperature: 28.8, precipitation: 150, humidity: 82 },
      { month: 9, temperature: 24.8, precipitation: 155, humidity: 78 },
      { month: 10, temperature: 19.5, precipitation: 75, humidity: 72 },
      { month: 11, temperature: 13.5, precipitation: 60, humidity: 70 },
      { month: 12, temperature: 6.8, precipitation: 45, humidity: 70 }
    ]
  }
];

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export const MIN_TEMPERATURE = -10;
export const MAX_TEMPERATURE = 40;

function getTemperatureColor(temp: number): string {
  const t = Math.max(MIN_TEMPERATURE, Math.min(MAX_TEMPERATURE, temp));
  const ratio = (t - MIN_TEMPERATURE) / (MAX_TEMPERATURE - MIN_TEMPERATURE);
  
  const r1 = 0, g1 = 191, b1 = 255;
  const r2 = 255, g2 = 69, b2 = 0;
  
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function getTemperatureScale(temp: number): number {
  const t = Math.max(MIN_TEMPERATURE, Math.min(MAX_TEMPERATURE, temp));
  return 0.3 + ((t - MIN_TEMPERATURE) / (MAX_TEMPERATURE - MIN_TEMPERATURE)) * 0.8;
}

function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return [x, y, z];
}

export function getAllCities(): CityClimateData[] {
  return CITIES_DATA;
}

export function getCityById(id: string): CityClimateData | undefined {
  return CITIES_DATA.find(c => c.id === id);
}

export function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] || MONTH_NAMES[0];
}

export function getTemperatureInfo(temp: number) {
  return {
    color: getTemperatureColor(temp),
    scale: getTemperatureScale(temp)
  };
}

export function getCityPosition(city: CityClimateData, radius: number = 2): [number, number, number] {
  return latLngToVector3(city.lat, city.lng, radius);
}

export function getCityMonthlyData(city: CityClimateData, monthIndex: number): MonthlyClimateData {
  return city.monthlyData[monthIndex] || city.monthlyData[0];
}

export function compareCities(
  city1: CityClimateData,
  city2: CityClimateData,
  monthIndex: number,
  dimension: 'temperature' | 'precipitation' | 'humidity'
): { city1Value: number; city2Value: number; diff: number } {
  const d1 = city1.monthlyData[monthIndex] || city1.monthlyData[0];
  const d2 = city2.monthlyData[monthIndex] || city2.monthlyData[0];
  
  return {
    city1Value: d1[dimension],
    city2Value: d2[dimension],
    diff: d1[dimension] - d2[dimension]
  };
}

export function getYearlyDimensionData(
  city: CityClimateData,
  dimension: 'temperature' | 'precipitation' | 'humidity'
): number[] {
  return city.monthlyData.map(m => m[dimension]);
}

export function normalizeData(values: number[], minVal: number, maxVal: number): number[] {
  return values.map(v => (v - minVal) / (maxVal - minVal));
}
