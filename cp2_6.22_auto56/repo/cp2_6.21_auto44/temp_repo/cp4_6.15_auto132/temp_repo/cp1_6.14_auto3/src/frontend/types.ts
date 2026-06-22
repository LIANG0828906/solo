export type EmotionTag =
  | 'happy' | 'sad' | 'angry' | 'calm'
  | 'excited' | 'romantic' | 'tired' | 'anxious'

export interface Song {
  id: string
  title: string
  artist: string
  album: string
  cover: string
  previewUrl: string
  duration: number
  emotions: EmotionTag[]
}

export interface EmotionResult {
  primary: EmotionTag
  tags: EmotionTag[]
  confidence: number
  label: { cn: string; emoji: string; color: string }
}

export interface RecommendResponse {
  latencyMs: number
  emotion: EmotionResult
  songs: Song[]
}

export interface FavoriteItem {
  id: string
  song: Song
  addedAt: number
}

export interface HistoryItem {
  id: string
  song: Song
  playedAt: number
  emotion?: EmotionTag
}
