export type TrainingType = 'strength' | 'cardio' | 'yoga' | 'other';

export interface TrainingRecord {
  id: number;
  type: TrainingType;
  typeName: string;
  duration: number;
  date: string;
  note: string;
  createdAt?: string;
}

export interface CreateRecordDto {
  type: TrainingType;
  duration: number;
  date: string;
  note: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  condition: string;
}

export interface DailyStat {
  date: string;
  duration: number;
}

export interface TypeStat {
  type: string;
  typeName: string;
  duration: number;
  color: string;
}

export interface MonthStats {
  month: string;
  dailyStats: DailyStat[];
  typeStats: TypeStat[];
  totalDuration: number;
  totalRecords: number;
}

export const TRAINING_TYPES: { value: TrainingType; label: string; color: string }[] = [
  { value: 'strength', label: '力量训练', color: '#e74c3c' },
  { value: 'cardio', label: '有氧', color: '#3498db' },
  { value: 'yoga', label: '瑜伽', color: '#2ecc71' },
  { value: 'other', label: '其他', color: '#9b59b6' },
];

export function getTrainingTypeInfo(type: TrainingType) {
  return TRAINING_TYPES.find(t => t.value === type) || TRAINING_TYPES[3];
}
