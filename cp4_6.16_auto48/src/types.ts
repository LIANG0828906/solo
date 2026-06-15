export type PlantCategory = '多肉' | '蕨类' | '观叶' | '开花' | '仙人掌';

export type LightRequirement = '喜阴' | '半阴' | '喜阳';

export type RecordType = 'water' | 'fertilize' | 'prune' | 'repot' | 'photo';

export interface Plant {
  id: string;
  name: string;
  category: PlantCategory;
  light: LightRequirement;
  waterFrequency: number;
  avatar: string;
  location: string;
  createdAt: number;
}

export interface PlantRecord {
  id: string;
  plantId: string;
  type: RecordType;
  date: number;
  note: string;
  photo?: string;
}

export interface RecordGroup {
  dateKey: string;
  dateLabel: string;
  records: PlantRecord[];
}
