export interface Goal {
  id: string;
  name: string;
  totalPlannedHours: number;
  accumulatedMinutes: number;
  dailyGoalMinutes: number;
  order: number;
  createdAt: string;
}

export interface StudyRecord {
  id: string;
  goalId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note?: string;
  createdAt: string;
}
