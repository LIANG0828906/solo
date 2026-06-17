export interface WrinkleStats {
  averageIntensity: number
  maxIntensity: number
  maxPosition: { x: number; y: number }
}

export interface WrinkleData {
  gridSpacing: number
  intensities: number[][]
  stats: WrinkleStats
}
