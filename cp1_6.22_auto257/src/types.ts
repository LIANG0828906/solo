export type ZoneType = 'commercial' | 'residential' | 'industrial' | 'park';

export interface Building {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  zoneType: ZoneType;
  basePollution: number;
  currentPollution: number;
  lightSources: LightSources;
  hourlyData: number[];
}

export interface LightSources {
  streetLights: number;
  billboards: number;
  buildingLights: number;
  trafficLights: number;
}

export interface PollutionRenderData {
  color: string;
  barHeight: number;
  value: number;
}

export interface ZoneInfo {
  name: string;
  color: string;
  basePollutionRange: [number, number];
}

export const ZONE_INFO: Record<ZoneType, ZoneInfo> = {
  commercial: {
    name: '商业区',
    color: '#F5F5DC',
    basePollutionRange: [60, 95]
  },
  residential: {
    name: '住宅区',
    color: '#E6E6FA',
    basePollutionRange: [30, 60]
  },
  industrial: {
    name: '工业区',
    color: '#C0C0C0',
    basePollutionRange: [50, 85]
  },
  park: {
    name: '公园区',
    color: '#98FB98',
    basePollutionRange: [5, 25]
  }
};

export const LIGHT_SOURCE_COLORS = {
  streetLights: '#FF6B6B',
  billboards: '#4ECDC4',
  buildingLights: '#45B7D1',
  trafficLights: '#96CEB4'
};

export const LIGHT_SOURCE_NAMES: Record<keyof LightSources, string> = {
  streetLights: '路灯',
  billboards: '广告牌',
  buildingLights: '建筑照明',
  trafficLights: '车流灯光'
};

export const POLLUTION_COLOR_STOPS = [
  { value: 0, color: '#00FF00' },
  { value: 25, color: '#7FFF00' },
  { value: 50, color: '#FFFF00' },
  { value: 75, color: '#FF7F00' },
  { value: 100, color: '#FF0000' }
];
