export interface WrinkleStats {
  averageIntensity: number
  maxIntensity: number
  maxWrinkleX: number
  maxWrinkleY: number
}

export interface WrinkleGridPoint {
  x: number
  y: number
  intensity: number
}

export interface AppState {
  capturedImage: string | null
  sensitivity: number
  stats: WrinkleStats
}
