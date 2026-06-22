import { create } from 'zustand'
import type { TestCaseResult, EvaluationSummary, CodeDiff } from '@/assessment/types'

type EvaluationStatus = 'idle' | 'queued' | 'running' | 'completed'

interface EvaluationState {
  status: EvaluationStatus
  testCases: TestCaseResult[]
  summary: EvaluationSummary | null
  diff: CodeDiff[]
  evaluationId: string | null
  code: string
  language: 'javascript' | 'python'
  leftWidth: number
  setCode: (code: string) => void
  setLanguage: (lang: 'javascript' | 'python') => void
  setStatus: (status: EvaluationStatus) => void
  addTestCaseResult: (result: TestCaseResult) => void
  setSummary: (summary: EvaluationSummary) => void
  setDiff: (diff: CodeDiff[]) => void
  setEvaluationId: (id: string) => void
  setLeftWidth: (width: number) => void
  reset: () => void
}

const initialCode = `function factorial(n) {
  // Write your code here

}`

export const useEvaluationStore = create<EvaluationState>((set) => ({
  status: 'idle',
  testCases: [],
  summary: null,
  diff: [],
  evaluationId: null,
  code: initialCode,
  language: 'javascript',
  leftWidth: 60,
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setStatus: (status) => set({ status }),
  addTestCaseResult: (result) => set((state) => ({ testCases: [...state.testCases, result] })),
  setSummary: (summary) => set({ summary }),
  setDiff: (diff) => set({ diff }),
  setEvaluationId: (evaluationId) => set({ evaluationId }),
  setLeftWidth: (leftWidth) => set({ leftWidth }),
  reset: () => set({
    status: 'idle',
    testCases: [],
    summary: null,
    diff: [],
    evaluationId: null,
  }),
}))
