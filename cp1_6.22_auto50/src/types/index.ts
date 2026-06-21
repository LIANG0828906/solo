export interface RunResult {
  status: 'success' | 'error'
  output: string
  error?: string
  executionTime: number
}

export interface HistoryRecord {
  id: string
  userId: string
  code: string
  status: 'success' | 'error'
  timestamp: number
  output: string
  error?: string
}

export interface AccuracyPoint {
  index: number
  accuracy: number
}
