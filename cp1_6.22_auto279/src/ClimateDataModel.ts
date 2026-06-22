export interface DataPoint {
  timestamp: number
  value: number
}

export interface GlacierState {
  year: number
  temperature: number
  seaLevel: number
  area: number
  volume: number
  vertexHeightMultiplier: number
  colorTint: string
}

export interface ClimateStats {
  currentArea: number
  currentVolume: number
  currentSeaLevelContribution: number
  areaTrend: DataPoint[]
  volumeTrend: DataPoint[]
  seaLevelTrend: DataPoint[]
}

const HISTORICAL_DATA: GlacierState[] = [
  {
    year: 1990,
    temperature: -5.0,
    seaLevel: 0.0,
    area: 12500,
    volume: 3200,
    vertexHeightMultiplier: 1.3,
    colorTint: '#C8E0F5',
  },
  {
    year: 2000,
    temperature: -4.0,
    seaLevel: 0.3,
    area: 11800,
    volume: 2950,
    vertexHeightMultiplier: 1.2,
    colorTint: '#BEDBF3',
  },
  {
    year: 2010,
    temperature: -3.0,
    seaLevel: 0.7,
    area: 10500,
    volume: 2600,
    vertexHeightMultiplier: 1.1,
    colorTint: '#B4D6F1',
  },
  {
    year: 2020,
    temperature: -2.0,
    seaLevel: 1.2,
    area: 8900,
    volume: 2150,
    vertexHeightMultiplier: 1.0,
    colorTint: '#B0D4F1',
  },
]

const MAX_DATA_POINTS = 120
const SEA_LEVEL_CONVERSION_FACTOR = 0.001

export class ClimateDataModel {
  private currentTemperature: number = -2
  private currentSeaLevel: number = 1
  private historicalData: Map<number, GlacierState> = new Map()
  private areaHistory: DataPoint[] = []
  private volumeHistory: DataPoint[] = []
  private seaLevelContributionHistory: DataPoint[] = []
  private baselineArea: number = 8900
  private baselineVolume: number = 2150

  constructor() {
    HISTORICAL_DATA.forEach((state) => {
      this.historicalData.set(state.year, state)
    })
  }

  setTemperature(temperature: number): void {
    this.currentTemperature = temperature
  }

  setSeaLevel(seaLevel: number): void {
    this.currentSeaLevel = seaLevel
  }

  getCurrentTemperature(): number {
    return this.currentTemperature
  }

  getCurrentSeaLevel(): number {
    return this.currentSeaLevel
  }

  getHistoricalState(year: number): GlacierState | undefined {
    return this.historicalData.get(year)
  }

  getAvailableYears(): number[] {
    return Array.from(this.historicalData.keys()).sort((a, b) => a - b)
  }

  getGlacierArea(): number {
    const temperatureFactor = Math.max(
      0.3,
      1 - (this.currentTemperature + 10) / 25
    )
    const seaLevelFactor = Math.max(0.8, 1 - this.currentSeaLevel / 20)
    return Math.round(this.baselineArea * temperatureFactor * seaLevelFactor)
  }

  getGlacierVolume(): number {
    const temperatureFactor = Math.max(
      0.2,
      1 - (this.currentTemperature + 10) / 20
    )
    const seaLevelFactor = Math.max(0.7, 1 - this.currentSeaLevel / 15)
    return Math.round(this.baselineVolume * temperatureFactor * seaLevelFactor)
  }

  getSeaLevelContribution(): number {
    const meltedVolume = this.baselineVolume - this.getGlacierVolume()
    return Math.round(meltedVolume * SEA_LEVEL_CONVERSION_FACTOR * 100) / 100
  }

  sampleData(): void {
    const now = Date.now()
    const area = this.getGlacierArea()
    const volume = this.getGlacierVolume()
    const seaLevelContribution = this.getSeaLevelContribution()

    this.areaHistory.push({ timestamp: now, value: area })
    this.volumeHistory.push({ timestamp: now, value: volume })
    this.seaLevelContributionHistory.push({
      timestamp: now,
      value: seaLevelContribution,
    })

    if (this.areaHistory.length > MAX_DATA_POINTS) {
      this.areaHistory.shift()
    }
    if (this.volumeHistory.length > MAX_DATA_POINTS) {
      this.volumeHistory.shift()
    }
    if (this.seaLevelContributionHistory.length > MAX_DATA_POINTS) {
      this.seaLevelContributionHistory.shift()
    }
  }

  getAreaTrend(fromYear?: number): DataPoint[] {
    if (fromYear && this.historicalData.has(fromYear)) {
      const historicalState = this.historicalData.get(fromYear)!
      const historicalPoint: DataPoint = {
        timestamp: this.getYearTimestamp(fromYear),
        value: historicalState.area,
      }
      return [historicalPoint, ...this.areaHistory]
    }
    return this.areaHistory
  }

  getVolumeTrend(fromYear?: number): DataPoint[] {
    if (fromYear && this.historicalData.has(fromYear)) {
      const historicalState = this.historicalData.get(fromYear)!
      const historicalPoint: DataPoint = {
        timestamp: this.getYearTimestamp(fromYear),
        value: historicalState.volume,
      }
      return [historicalPoint, ...this.volumeHistory]
    }
    return this.volumeHistory
  }

  getSeaLevelTrend(fromYear?: number): DataPoint[] {
    if (fromYear && this.historicalData.has(fromYear)) {
      const historicalState = this.historicalData.get(fromYear)!
      const historicalContribution =
        (this.baselineVolume - historicalState.volume) *
        SEA_LEVEL_CONVERSION_FACTOR
      const historicalPoint: DataPoint = {
        timestamp: this.getYearTimestamp(fromYear),
        value: Math.round(historicalContribution * 100) / 100,
      }
      return [historicalPoint, ...this.seaLevelContributionHistory]
    }
    return this.seaLevelContributionHistory
  }

  getStats(fromYear?: number): ClimateStats {
    return {
      currentArea: this.getGlacierArea(),
      currentVolume: this.getGlacierVolume(),
      currentSeaLevelContribution: this.getSeaLevelContribution(),
      areaTrend: this.getAreaTrend(fromYear),
      volumeTrend: this.getVolumeTrend(fromYear),
      seaLevelTrend: this.getSeaLevelTrend(fromYear),
    }
  }

  reset(): void {
    this.currentTemperature = -2
    this.currentSeaLevel = 1
    this.areaHistory = []
    this.volumeHistory = []
    this.seaLevelContributionHistory = []
  }

  private getYearTimestamp(year: number): number {
    const now = Date.now()
    const yearsAgo = new Date().getFullYear() - year
    return now - yearsAgo * 365 * 24 * 60 * 60 * 1000
  }
}
