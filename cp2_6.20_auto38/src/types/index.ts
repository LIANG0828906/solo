export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'not_started' | 'in_progress' | 'submitted';
  templateCode: string;
  language: 'python' | 'javascript' | 'java';
  testCases: TestCase[];
}

export interface TestResult {
  testCaseId: string;
  testCaseName: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
}

export interface LintIssue {
  line: number;
  column: number;
  severity: 'warning' | 'error';
  message: string;
  rule: string;
}

export interface EvaluationResult {
  id: string;
  assignmentId: string;
  score: number;
  totalTests: number;
  passedTests: number;
  testResults: TestResult[];
  lintIssues: LintIssue[];
  timestamp: string;
}
