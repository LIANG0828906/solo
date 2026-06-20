export type TaskType = 'work' | 'study' | 'life' | 'exercise' | 'social' | 'other';

export interface TimeBlock {
  id: string;
  date: string;
  title: string;
  startTime: number;
  endTime: number;
  color: string;
  type: TaskType;
  note: string;
  lane: number;
}

export interface ReviewData {
  blockId: string;
  completed: boolean;
  actualStart: number;
  actualEnd: number;
  satisfaction: number;
}

export interface DailyReport {
  date: string;
  completionRate: number;
  utilizationRate: number;
  typeDistribution: Record<string, number>;
  encouragement: string;
  generated: boolean;
}
