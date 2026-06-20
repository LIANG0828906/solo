export type CareType = 'water' | 'fertilize' | 'repot' | 'prune';

export interface CareEvent {
  id: string;
  type: CareType;
  date: string;
  note?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  purchaseDate: string;
  location: string;
  image?: string | null;
  events: CareEvent[];
  nextWaterDate?: string;
  nextFertilizeDate?: string;
}

export interface Reminder {
  plantId: string;
  plantName: string;
  careType: CareType;
  dueDate: string;
  daysFromToday: number;
  status: 'overdue' | 'upcoming' | 'normal';
}

export const SPECIES_LIST = ['多肉', '绿萝', '兰花', '其他'];
export const LOCATION_LIST = ['阳台', '客厅', '卧室', '书房', '厨房', '卫生间'];

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  water: '浇水',
  fertilize: '施肥',
  repot: '换盆',
  prune: '修剪'
};

export const WATER_INTERVALS: Record<string, number> = {
  '多肉': 7,
  '绿萝': 3,
  '兰花': 5,
  '其他': 4
};

export const FERTILIZE_INTERVAL = 30;
