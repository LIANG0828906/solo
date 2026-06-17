import { create } from 'zustand'
import { AnalysisResult, AnalysisStatus } from '../types'
import { analyzeText } from '../analyzer/textAnalyzer'

interface AnalysisState {
  inputText: string
  result: AnalysisResult | null
  status: AnalysisStatus
  error: string | null
  setInputText: (text: string) => void
  runAnalysis: () => Promise<void>
  clearAnalysis: () => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  inputText: '',
  result: null,
  status: 'idle',
  error: null,

  setInputText: (text: string) => set({ inputText: text }),

  runAnalysis: async () => {
    const { inputText } = get()
    
    if (!inputText.trim()) {
      set({ status: 'error', error: '请输入文本后再进行分析' })
      return
    }

    set({ status: 'loading', error: null })

    await new Promise(resolve => setTimeout(resolve, 600))

    try {
      const result = analyzeText(inputText)
      set({ result, status: 'success' })
    } catch (err) {
      set({ 
        status: 'error', 
        error: err instanceof Error ? err.message : '分析过程中发生错误' 
      })
    }
  },

  clearAnalysis: () => {
    set({
      inputText: '',
      result: null,
      status: 'idle',
      error: null
    })
  }
}))
