export interface TestCase {
  id: string;
  input: string;
  expected: string;
  hidden: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: TestCase[];
  createdAt: number;
}

export interface TestResult {
  caseId: string;
  passed: boolean;
  actual: string;
  expected: string;
  hidden: boolean;
}

export interface Comment {
  id: string;
  author: 'teacher' | 'student';
  content: string;
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  language: 'python' | 'javascript';
  code: string;
  score: number;
  results: TestResult[];
  comments: Comment[];
  submittedAt: number;
}

export interface SubmitRequest {
  assignmentId: string;
  studentId: string;
  studentName: string;
  language: 'python' | 'javascript';
  code: string;
}

export interface SubmitResponse {
  submissionId: string;
  score: number;
  results: TestResult[];
  stdout?: string;
  stderr?: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: Omit<TestCase, 'id'>[];
}

export interface StatsResponse {
  distribution: { range: string; count: number }[];
  submissions: Submission[];
}
