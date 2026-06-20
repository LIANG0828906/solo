export interface KeyResult {
  id: string;
  name: string;
  description: string;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
}

export interface Objective {
  id: string;
  name: string;
  owner: string;
  ownerInitials: string;
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
  keyResults: KeyResult[];
  createdAt: string;
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  objectives: Objective[];
}

export type FilterType = 'all' | 'mine' | 'not_started' | 'in_progress' | 'at_risk';

export interface ChartDataPoint {
  name: string;
  value: number;
}
