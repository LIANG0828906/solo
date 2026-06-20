export interface TestCase {
  input: string;
  expected: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  testCases: TestCase[];
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  code: string;
  submittedAt: number;
  testResults: TestResult[];
  passedCount: number;
  totalCount: number;
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface Review {
  id: string;
  assignmentId: string;
  submissionId: string;
  reviewerId: string;
  score: number;
  comment: string;
  createdAt: number;
}

export interface AssignmentStats {
  assignmentId: string;
  totalSubmissions: number;
  averagePassRate: number;
  averageScore: number;
  hourlyDistribution: number[];
  submissions: SubmissionWithReviews[];
}

export interface SubmissionWithReviews extends Submission {
  reviews: Review[];
  averageReviewScore: number;
}

export type UserRole = 'teacher' | 'student';

export interface Notification {
  id: string;
  type: 'assignment' | 'review_received' | 'review_submitted';
  message: string;
  createdAt: number;
  read: boolean;
}
