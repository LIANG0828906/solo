export type StudentNeed = 'vision_impaired' | 'hearing_impaired' | 'noisy';

export type Grade = 'freshman' | 'sophomore' | 'junior' | 'senior';

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  specialNeeds: StudentNeed[];
}

export type Seat = Student | null;

export type SeatLayout = Seat[][];

export interface SeatPosition {
  row: number;
  col: number;
}

export type ConflictType = 'vision_back' | 'hearing_back' | 'noisy_adjacent';

export type Severity = 'must_fix' | 'suggest_fix';

export interface Conflict {
  id: string;
  seats: [SeatPosition, SeatPosition];
  type: ConflictType;
  severity: Severity;
  description: string;
  suggestion: string;
}

export const GRADE_COLORS: Record<Grade, string> = {
  freshman: '#42A5F5',
  sophomore: '#66BB6A',
  junior: '#FFA726',
  senior: '#EF5350',
};

export const GRADE_LABELS: Record<Grade, string> = {
  freshman: '大一',
  sophomore: '大二',
  junior: '大三',
  senior: '大四',
};

export const NEED_LABELS: Record<StudentNeed, string> = {
  vision_impaired: '视力不佳',
  hearing_impaired: '听力障碍',
  noisy: '吵闹',
};

export const ROWS = 6;
export const COLS = 8;
