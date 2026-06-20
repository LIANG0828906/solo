export type PlotStatus = 'idle' | 'planted' | 'harvestable';

export interface JournalEntry {
  id: string;
  cropName: string;
  plantDate: string;
  waterNote: string;
  timestamp: number;
}

export interface Plot {
  id: string;
  row: number;
  col: number;
  status: PlotStatus;
  ownerName?: string;
  ownerAvatar?: string;
  cropName?: string;
  plantDate?: string;
  daysToHarvest?: number;
  waterRecords: string[];
  journal: JournalEntry[];
  exchangeable: boolean;
  highlight?: boolean;
  waterDrop?: boolean;
}

export interface GardenStats {
  idle: number;
  planted: number;
  harvestable: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
}

export interface GrowthPoint {
  dayLabel: string;
  height: number;
}
