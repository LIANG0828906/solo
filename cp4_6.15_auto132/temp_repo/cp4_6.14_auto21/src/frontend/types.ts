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
  instructor?: Instructor;
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

export interface LearnerProgress {
  course: Course;
  enrollment: Enrollment;
  progress: number;
  remainingChapters: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'assessed';
}

export interface AssessmentResponse {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}

export interface AnalyticsStats {
  totalCourses: number;
  totalLearners: number;
  averageScore: number;
  completionRate: number;
}

export interface TimeSlotStat {
  slot: string;
  count: number;
}
