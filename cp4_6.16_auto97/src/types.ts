export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'javascript' | 'python';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  passRate: number;
  functionName: string;
  initialCodeJS: string;
  initialCodePY: string;
  testCases: TestCase[];
  examples: { input: string; output: string; explanation?: string }[];
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  code: string;
  language: Language;
  passed: boolean;
  timestamp: number;
  results: TestResult[];
}

export interface DailyRecord {
  date: string;
  count: number;
}

export interface UserStats {
  totalSolved: number;
  totalSubmissions: number;
  passRate: number;
  dailyRecords: DailyRecord[];
  solvedChallengeIds: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: number | null;
}

export interface SandboxRunMessage {
  type: 'run';
  code: string;
  language: Language;
}

export interface SandboxTestMessage {
  type: 'test';
  code: string;
  functionName: string;
  testCases: TestCase[];
  language: Language;
}

export interface SandboxResultMessage {
  type: 'run_result';
  output: string;
  error: string | null;
}

export interface SandboxTestResultMessage {
  type: 'test_result';
  results: TestResult[];
}
