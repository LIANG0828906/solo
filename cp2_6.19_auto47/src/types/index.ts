export interface ClassEntity {
  id: string;
  name: string;
  studentNames: string[];
  createdAt: number;
}

export interface Annotation {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  content: string;
  createdAt: number;
}

export interface Submission {
  id: string;
  classId: string;
  studentName: string;
  title: string;
  content: string;
  submittedAt: number;
  annotations: Annotation[];
  overallComment: string;
  score: number | null;
  gradedAt: number | null;
}

export interface AppState {
  classes: ClassEntity[];
  submissions: Submission[];
  currentClassId: string | null;
  currentSubmissionId: string | null;
}
