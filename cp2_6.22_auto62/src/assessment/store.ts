import { create } from 'zustand'
import type {
  TestCaseResult,
  EvaluationSummary,
  CodeDiff,
  TrackedTestCase,
  TestCaseStatus,
} from '@/assessment/types'
import { TEST_CASES } from './testcases'

type EvaluationStatus = 'idle' | 'queued' | 'running' | 'completed'

interface EvaluationState {
  status: EvaluationStatus
  trackedCases: TrackedTestCase[]
  summary: EvaluationSummary | null
  diff: CodeDiff[]
  evaluationId: string | null
  code: string
  language: 'javascript' | 'python'
  leftWidth: number
  setCode: (code: string) => void
  setLanguage: (lang: 'javascript' | 'python') => void
  setStatus: (status: EvaluationStatus) => void
  initTrackedCases: () => void
  setCaseStatus: (index: number, status: TestCaseStatus) => void
  applyTestCaseResult: (index: number, result: TestCaseResult) => void
  setSummary: (summary: EvaluationSummary) => void
  setDiff: (diff: CodeDiff[]) => void
  setEvaluationId: (id: string) => void
  setLeftWidth: (width: number) => void
  reset: () => void
}

const initialCodeJs = `function factorial(n) {
  // Write your code here

}`

const initialCodePy = `def factorial(n):
    # Write your code here
    pass
`

export const useEvaluationStore = create<EvaluationState>((set) => ({
  status: 'idle',
  trackedCases: [],
  summary: null,
  diff: [],
  evaluationId: null,
  code: initialCodeJs,
  language: 'javascript',
  leftWidth: 60,
  setCode: (code) => set({ code }),
  setLanguage: (language) =>
    set({
      language,
      code: language === 'javascript' ? initialCodeJs : initialCodePy,
    }),
  setStatus: (status) => set({ status }),
  initTrackedCases: () =>
    set({
      trackedCases: TEST_CASES.map((tc) => ({
        name: tc.name,
        input: tc.input,
        expected: tc.expected,
        status: 'pending',
        executionTime: 0,
      })),
    }),
  setCaseStatus: (index: number, status: TestCaseStatus) =>
    set((state) => ({
      trackedCases: state.trackedCases.map((tc, i) =>
        i === index ? { ...tc, status } : tc,
      ),
    })),
  applyTestCaseResult: (index: number, result: TestCaseResult) =>
    set((state) => ({
      trackedCases: state.trackedCases.map((tc, i) =>
        i === index
          ? {
              ...tc,
              status: result.passed ? 'passed' : 'failed',
              actual: result.actual,
              error: result.error,
              executionTime: result.executionTime,
              stackTrace: result.stackTrace,
            }
          : tc,
      ),
    })),
  setSummary: (summary) => set({ summary }),
  setDiff: (diff) => set({ diff }),
  setEvaluationId: (evaluationId) => set({ evaluationId }),
  setLeftWidth: (leftWidth) => set({ leftWidth }),
  reset: () =>
    set({
      status: 'idle',
      trackedCases: [],
      summary: null,
      diff: [],
      evaluationId: null,
    }),
}))
