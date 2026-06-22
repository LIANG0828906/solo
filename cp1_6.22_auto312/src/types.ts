export type PlantCategory = '多肉' | '观叶' | '开花' | '水生';

export type EventType = '浇水' | '施肥' | '修剪' | '换盆';

export type FertilizerType = '普通' | '促花' | '促根';

export interface Plant {
  id: string;
  name: string;
  category: PlantCategory;
  initialHeight: number;
  initialLeaves: number;
  createdAt: string;
  growthRecords: GrowthRecord[];
}

export interface GrowthRecord {
  id: string;
  plantId: string;
  eventType: EventType;
  timestamp: string;
  height?: number;
  leaves?: number;
  fertilizerType?: FertilizerType;
  note?: string;
}

export interface ChartDataPoint {
  week: string;
  date: string;
  height: number;
  leaves: number;
}

export interface ChartOption {
  data: ChartDataPoint[];
  heightAxis: {
    name: string;
    color: string;
  };
  leavesAxis: {
    name: string;
    color: string;
  };
}
