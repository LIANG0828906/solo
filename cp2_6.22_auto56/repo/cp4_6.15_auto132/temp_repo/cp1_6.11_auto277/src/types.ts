export interface WaterLevelData {
  upstream: number;
  midstream: number;
  downstream: number;
}

export interface HistoryRecord {
  time: string;
  values: WaterLevelData;
}

export type WaterLevelChangeCallback = (location: string, newLevel: number) => void;
export type AlertCallback = (location: string, active: boolean) => void;

export const THRESHOLDS: WaterLevelData = {
  upstream: 80,
  midstream: 70,
  downstream: 60
};

export const LOCATION_KEYS: (keyof WaterLevelData)[] = ['upstream', 'midstream', 'downstream'];

export const LOCATION_LABELS: Record<keyof WaterLevelData, string> = {
  upstream: '上游',
  midstream: '中游',
  downstream: '下游'
};
