export type BuildingStyle = 'classical' | 'modern' | 'postmodern';

export type BuildingZone = 'cbd' | 'oldtown' | 'waterfront' | 'newdistrict';

export interface BuildingData {
  id: string;
  name: string;
  year: number;
  height: number;
  style: BuildingStyle;
  zone: BuildingZone;
  x: number;
  z: number;
}

export interface ZoneInfo {
  id: BuildingZone;
  name: string;
  color: string;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}

export const STYLE_COLORS: Record<BuildingStyle, string> = {
  classical: '#C4A47A',
  modern: '#4ECDC4',
  postmodern: '#FF6B6B',
};

export const STYLE_NAMES: Record<BuildingStyle, string> = {
  classical: '古典',
  modern: '现代',
  postmodern: '后现代',
};

export const ZONE_INFO: Record<BuildingZone, ZoneInfo> = {
  cbd: {
    id: 'cbd',
    name: '中心商务区',
    color: '#FFD93D22',
    centerX: 0,
    centerZ: 0,
    width: 50,
    depth: 50,
  },
  oldtown: {
    id: 'oldtown',
    name: '老城区',
    color: '#4D96FF22',
    centerX: -50,
    centerZ: -30,
    width: 45,
    depth: 40,
  },
  waterfront: {
    id: 'waterfront',
    name: '滨水区',
    color: '#6BCB7722',
    centerX: 50,
    centerZ: 20,
    width: 40,
    depth: 55,
  },
  newdistrict: {
    id: 'newdistrict',
    name: '新兴开发区',
    color: '#9B59B622',
    centerX: 0,
    centerZ: -60,
    width: 55,
    depth: 35,
  },
};

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2020;
export const MIN_HEIGHT = 30;
export const MAX_HEIGHT = 80;
