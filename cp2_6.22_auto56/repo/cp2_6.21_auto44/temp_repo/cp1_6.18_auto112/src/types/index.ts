export interface SentenceSentiment {
  id: string
  text: string
  sentimentScore: number
  sentimentLabel: 'positive' | 'negative' | 'neutral'
  toneTags: string[]
}

export interface SentimentResult {
  sentences: SentenceSentiment[]
  overallScore: number
}

export interface ReadabilityResult {
  fleschKincaid: number
  fleschKincaidGrade: string
  wordCount: number
  sentenceCount: number
  syllableCount: number
  avgWordLength: number
}

export interface AnalysisResult {
  sentiment: SentimentResult
  readability: ReadabilityResult
  timestamp: number
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error'
