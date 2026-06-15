export interface StormPathPoint {
  lat: number;
  lon: number;
  windSpeed: number;
  pressure: number;
  timestamp: string;
}

export interface StormRecord {
  id: string;
  name: string;
  year: number;
  basin: string;
  category: number;
  maxWind: number;
  minPressure: number;
  landfall: string;
  durationDays: number;
  path: StormPathPoint[];
}

export interface FilterState {
  yearRange: [number, number];
  category: number | null;
  basin: string | null;
}

export const BASINS = [
  { id: 'NA', name: '北大西洋' },
  { id: 'EP', name: '东太平洋' },
  { id: 'WP', name: '西太平洋' },
  { id: 'NI', name: '北印度洋' },
  { id: 'SI', name: '南印度洋' },
  { id: 'SP', name: '南太平洋' },
];

export const CATEGORIES = [
  { level: 1, label: '一级', windRange: '74-95 mph', color: '#4ade80' },
  { level: 2, label: '二级', windRange: '96-110 mph', color: '#facc15' },
  { level: 3, label: '三级', windRange: '111-129 mph', color: '#fb923c' },
  { level: 4, label: '四级', windRange: '130-156 mph', color: '#f87171' },
  { level: 5, label: '五级', windRange: '157+ mph', color: '#ef4444' },
];
