export type CourseStatus = 'not_started' | 'in_progress' | 'completed';

export interface Course {
  id: string;
  name: string;
  description: string;
  prerequisites: string[];
  knowledgePoints: string[];
  estimatedMinutes: number;
}

export interface UserProgress {
  courseId: string;
  status: CourseStatus;
  testScore: number;
  minutesSpent: number;
  lastUpdated: string;
}

export interface DailyActivity {
  date: string;
  minutes: number;
}

export interface RecommendedCourse {
  course: Course;
  confidence: number;
  reason: string;
}
