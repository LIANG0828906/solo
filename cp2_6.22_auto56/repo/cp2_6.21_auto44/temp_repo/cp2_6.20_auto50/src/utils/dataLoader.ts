export type DataType = 'temperature' | 'precipitation' | 'wind'

export interface DataPoint {
  lat: number
  lon: number
  value: number
}

export interface YearData {
  temperature: DataPoint[]
  precipitation: DataPoint[]
  wind: DataPoint[]
}

export type ClimateDataMap = Record<number, YearData>

export async function loadClimateData(): Promise<ClimateDataMap> {
  try {
    const response = await fetch('/data/climate.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    const result: ClimateDataMap = {}
    for (const key in data) {
      result[Number(key)] = data[key]
    }
    return result
  } catch (error) {
    throw new Error(`Failed to load climate data: ${error instanceof Error ? error.message : String(error)}`)
  }
}
