export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type TapResult = 'perfect' | 'good' | 'miss'

export interface TapRecord {
  timestamp: number
  deviation: number
  result: TapResult
  beatIndex: number
}

export interface BeatInfo {
  beatIndex: number
  measureIndex: number
  beatInMeasure: number
  timestamp: number
}

export interface DeviationResult {
  deviation: number
  result: TapResult
  nearestBeatTimestamp: number
}
