export type TestCaseStatus = 'pending' | 'running' | 'passed' | 'failed'

export interface TestCaseResult {
  name: string
  input: string
  expected: string
  actual: string
  passed: boolean
  error?: string
  executionTime: number
  stackTrace?: string
}

export interface TrackedTestCase {
  name: string
  input: string
  expected: string
  status: TestCaseStatus
  actual?: string
  error?: string
  executionTime: number
  stackTrace?: string
}

export interface EvaluationSummary {
  score: number
  passed: number
  total: number
  executionTime: number
  maxMemory: number
}

export interface CodeDiff {
  lineNumber: number
  type: 'added' | 'removed' | 'modified'
  content: string
  suggestion?: string
}
