export interface ProblemSummary {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  passRate: number;
}

export interface Problem extends ProblemSummary {
  description: string;
  examples: { input: string; output: string }[];
  starterCode: string;
}

export interface RunCodeResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export interface TestCaseResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
}

export interface SubmitCodeResponse {
  total: number;
  passedCount: number;
  results: TestCaseResult[];
  submissionId: string;
  timestamp: number;
}

export interface SubmissionRecord {
  id: string;
  problemId: string;
  code: string;
  passed: boolean;
  passedCount: number;
  total: number;
  results: TestCaseResult[];
  timestamp: number;
}
