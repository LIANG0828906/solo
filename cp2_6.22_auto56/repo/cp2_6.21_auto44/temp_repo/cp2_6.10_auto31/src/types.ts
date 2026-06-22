export interface Student {
  id: string;
  name: string;
  seatRow: number;
  seatCol: number;
}

export type CategoryType = 'morning' | 'copy' | 'answer';

export type GradeType = 'good' | 'bad';

export interface AssessmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  category: CategoryType;
  grade: GradeType;
  score: number;
  timestamp: number;
  date: string;
}

export interface StudentScore {
  studentId: string;
  studentName: string;
  totalScore: number;
  records: AssessmentRecord[];
}

export interface RankingItem {
  rank: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  award?: 'first' | 'second' | 'third';
}

export const CATEGORY_CONFIG: Record<CategoryType, { name: string; good: number; bad: number }> = {
  morning: { name: '晨读', good: 1, bad: -2 },
  copy: { name: '抄书', good: 2, bad: -3 },
  answer: { name: '答问', good: 3, bad: -5 }
};
