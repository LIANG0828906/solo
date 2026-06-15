export interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  confidence: number;
  unit: string;
}

export interface CheckInRecord {
  id: string;
  keyResultId: string;
  date: string;
  percentComplete: number;
  note: string;
  updatedBy: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  owner: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  keyResults: KeyResult[];
  checkIns: CheckInRecord[];
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export type ObjectiveStatus = Objective['status'];

export interface CreateObjectiveRequest {
  title: string;
  description: string;
  owner: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  keyResults: Omit<KeyResult, 'id'>[];
}

export interface UpdateObjectiveRequest {
  title?: string;
  description?: string;
  owner?: string;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year?: number;
  keyResults?: KeyResult[];
  status?: ObjectiveStatus;
}

export interface CheckInRequest {
  keyResultId: string;
  percentComplete: number;
  note: string;
  updatedBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
