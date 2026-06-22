import type { WeatherData } from '@/types'

export function generateWeatherData(): WeatherData[] {
  const dates: Array<'saturday' | 'sunday'> = ['saturday', 'sunday']
  const timeSlots: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening']
  const weatherList: WeatherData[] = []

  for (const date of dates) {
    for (const timeSlot of timeSlots) {
      weatherList.push({
        date,
        timeSlot,
        temperature: Math.floor(Math.random() * 21) + 15,
        precipitation: Math.floor(Math.random() * 101),
        windLevel: Math.floor(Math.random() * 5) + 1
      })
    }
  }

  return weatherList
}

export function formatWeatherDisplay(weather: WeatherData): string {
  const dateMap: Record<string, string> = { saturday: '周六', sunday: '周日' }
  const timeMap: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '傍晚' }
  return `${dateMap[weather.date]} ${timeMap[weather.timeSlot]}`
}
