export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  department: string;
}

export interface Chapter {
  id: string;
  title: string;
  duration: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  startTime: string;
  endTime: string;
  duration: number;
  chapters: Chapter[];
  assessment: Question[];
  createdAt: string;
}

export interface Enrollment {
  learnerId: string;
  courseId: string;
  enrolledAt: string;
  completedChapters: string[];
  assessmentScore: number | null;
  completedAt: string | null;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  instructorId: string;
  startTime: string;
  duration: number;
}

export interface CreateCourseResponse {
  success: boolean;
  course?: Course;
  conflict?: boolean;
  message?: string;
}

export interface UpdateChapterRequest {
  completed: boolean;
}

export interface SubmitAssessmentRequest {
  answers: