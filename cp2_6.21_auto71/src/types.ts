export type POICategory = 'toilet' | 'convenience' | 'cafe' | 'charging' | 'pharmacy';

export interface POI {
  id: string;
  category: POICategory;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SearchParams {
  center: [number, number];
  radius: number;
  startAngle: number;
  angleRange: number;
}

export interface SearchResult {
  poi: POI;
  distance: number;
  azimuth: number;
  azimuthText: string;
}

export interface CategoryConfig {
  key: POICategory;
  label: string;
  color: string;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: 'toilet', label: '公厕', color: '#3388ff' },
  { key: 'convenience', label: '便利店', color: '#ff6633' },
  { key: 'cafe', label: '咖啡馆', color: '#44bb44' },
  { key: 'charging', label: '充电桩', color: '#aa44ff' },
  { key: 'pharmacy', label: '药店', color: '#ff4444' },
];
