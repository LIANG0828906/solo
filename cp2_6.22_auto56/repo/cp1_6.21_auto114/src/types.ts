export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'cloudy'

export interface WeatherData {
  city: string
  temperature: number
  condition: WeatherCondition
  humidity: number
  windSpeed: number
}

export interface CharacterConfig {
  hatColor: string
  clothesColor: string
  eyeSize: number
  showGlasses: boolean
  skinColor: string
}

export interface HistoryRecord {
  id: string
  city: string
  weather: WeatherData
  config: CharacterConfig
  timestamp: number
}
