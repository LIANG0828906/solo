export interface GrowthRecord {
  id: string;
  date: string;
  content: string;
}

export interface Plant {
  id: string;
  name: string;
  category: string;
  waterFrequency: number;
  lastWateredDate: string;
  photo?: string;
  growthRecords: GrowthRecord[];
}

export interface TodayReminder {
  count: number;
  plants: Plant[];
}
