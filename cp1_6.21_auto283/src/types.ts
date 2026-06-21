export interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  duration: number;
}

export interface FreeSlot {
  startTime: string;
  endTime: string;
}

export interface SmartSuggestion {
  date: string;
  density: number;
  slots: FreeSlot[];
}

export interface DayStats {
  date: string;
  total: number;
  completed: number;
  rate: number;
}
