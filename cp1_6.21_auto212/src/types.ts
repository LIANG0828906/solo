export type DayNightMode = 'day' | 'night' | 'dusk'
export type WeatherType = 'sunny' | 'rain' | 'snow'

export interface BuildingUpdate {
  index: number
  heightDelta: number
  bottomColor: string
  topColor: string
}
