export interface Chapter {
  id: string;
  name: string;
  order: number;
  children: Chapter[];
  expanded?: boolean;
}

export interface Course {
  id: string;
  title: string;
  chapters: Chapter[];
  createdAt: number;
}

export interface Assignment {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  fileUrl?: string;
  submittedAt: number;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  gradedAt?: number;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  chapters: {
    chapterId: string;
    chapterName: string;
    completion: number;
  }[];
  recentGraded: Submission[];
}

export interface Database {
  courses: Course[];
  assignments: Assignment[];
  submissions: Submission[];
}
