export interface Plant {
  id: string;
  name: string;
  variety: string;
  plantDate: string;
  location: string;
  waterPreference: 'low' | 'medium' | 'high';
  category: string;
  photo?: string;
  growthLogs: GrowthLog[];
  waterRecords: WaterRecord[];
  alerts: Alert[];
}

export interface GrowthLog {
  id: string;
  date: string;
  height: number;
  leafCount: number;
  soilMoisture: number;
  leafColor: 'green' | 'yellow' | 'brown' | 'spotted';
  markedAbnormal: boolean;
}

export interface WaterRecord {
  id: string;
  date: string;
  type: 'water' | 'fertilize' | 'prune';
  amount?: number;
  note?: string;
}

export interface Alert {
  id: string;
  plantId: string;
  type: 'pest' | 'disease' | 'water';
  description: string;
  suggestion: string;
  date: string;
  resolved: boolean;
}

export type WaterStatus = 'normal' | 'need-water-soon' | 'need-water-now';

export interface ChartDataPoint {
  date: string;
  height: number;
  leafCount: number;
  soilMoisture: number;
}

export interface AppState {
  plants: Plant[];
  selectedPlantId: string | null;
  alerts: Alert[];
  filterCategory: string;
  mobileMenuOpen: boolean;
  notificationIndex: number;
}

export type AppAction =
  | { type: 'ADD_PLANT'; payload: Plant }
  | { type: 'UPDATE_PLANT'; payload: Plant }
  | { type: 'DELETE_PLANT'; payload: string }
  | { type: 'SELECT_PLANT'; payload: string | null }
  | { type: 'ADD_GROWTH_LOG'; payload: { plantId: string; log: GrowthLog } }
  | { type: 'ADD_WATER_RECORD'; payload: { plantId: string; record: WaterRecord } }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'RESOLVE_ALERT'; payload: string }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'NEXT_NOTIFICATION' }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };
