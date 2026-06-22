import axios from 'axios'
import type { WeatherData, CharacterConfig } from './types'

export async function fetchWeather(city: string): Promise<WeatherData> {
  const response = await axios.get<WeatherData>('/api/weather', {
    params: { city }
  })
  return response.data
}

export async function fetchDefaultConfig(): Promise<CharacterConfig> {
  const response = await axios.get<CharacterConfig>('/api/config')
  return response.data
}
