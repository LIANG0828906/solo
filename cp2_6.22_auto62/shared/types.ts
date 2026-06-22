export interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
  category: string;
  code: string;
}

export interface TestCaseResult {
  name: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  executionTime: number;
  stackTrace?: string;
}

export interface CodeDiff {
  lineNumber: number;
  type: "added" | "removed" | "modified";
  content: string;
  suggestion?: string;
}

export interface EvaluationSummary {
  score: number;
  passed: number;
  total: number;
  executionTime: number;
  maxMemory: number;
}

export interface EvaluationResult {
  evaluationId: string;
  status: "queued" | "running" | "completed";
  testCases: TestCaseResult[];
  summary: EvaluationSummary | null;
  diff: CodeDiff[];
}

export interface WsMessage {
  type: "status" | "testResult" | "summary";
  evaluationId: string;
  status?: "queued" | "running" | "completed";
  testCase?: TestCaseResult;
  index?: number;
  summary?: EvaluationSummary;
  diff?: CodeDiff[];
}
