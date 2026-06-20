export interface Subject {
  id: string;
  name: string;
  weight: number;
}

export interface Task {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  title: string;
  status: 'todo' | 'in-progress' | 'completed';
  duration: number;
}

export interface StudyLog {
  id: string;
  date: string;
  duration: number;
  subject?: string;
  startTime: string;
  endTime: string;
}

export interface ExamInfo {
  name: string;
  date: string;
  subjects: Subject[];
}

export type ViewType = 'planner' | 'timer' | 'logger';
