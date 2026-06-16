export type CareType = 'water' | 'fertilize' | 'prune' | 'sunlight';

export interface Plant {
  id: string;
  name: string;
  species: string;
  purchaseDate: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareLog {
  id: string;
  plantId: string;
  type: CareType;
  note?: string;
  image?: string;
  date: string;
  createdAt: string;
  height?: number;
}

export type CareTypeLabels = Record<CareType, string>;

export interface DateRecordModalData {
  date: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
}
