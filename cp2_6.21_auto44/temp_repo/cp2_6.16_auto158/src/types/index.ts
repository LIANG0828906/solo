export interface User {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  avatar: string;
  email: string;
}

export interface Student {
  id: string;
  name: string;
  instrument: string;
  avatar: string;
  level: string;
  joinDate: string;
}

export interface Course {
  id: string;
  studentId: string;
  teacherId: string;
  startTime: string;
  duration: number;
  instrument: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface PracticeRecord {
  id: string;
  studentId: string;
  date: string;
  duration: number;
  rating: number;
  notes?: string;
  audioUrl?: string;
}

export type AssignmentStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Assignment {
  id: string;
  studentId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string;
  status: AssignmentStatus;
  submittedAt?: string;
  feedback?: string;
  createdAt: string;
}

export type CourseConflictResult = {
  hasConflict: boolean;
  conflictingCourse?: Course;
};
