export type MoodType = 'happy' | 'calm' | 'excited' | 'tired'

export interface TravelMarker {
  id: string
  lat: number
  lng: number
  city: string
  country: string
  continent: string
  date: string
  mood: MoodType
  photo?: string
  createdAt: number
}

export interface TravelStats {
  totalCountries: number
  totalCities: number
  totalMarkers: number
  yearlyData: { year: number; count: number }[]
  monthlyData: { year: number; month: number; count: number }[]
  topCities: { city: string; count: number; country: string }[]
  countryCounts: { country: string; count: number; continent: string }[]
}

export interface ReverseGeocodeResult {
  city: string
  country: string
  continent: string
}

export const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  excited: '🤩',
  tired: '😴',
}

export const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  excited: '兴奋',
  tired: '疲倦',
}

export const CONTINENT_COLORS: Record<string, string> = {
  Asia: '#E74C3C',
  Europe: '#3498DB',
  Africa: '#E67E22',
  'North America': '#27AE60',
  'South America': '#27AE60',
  Oceania: '#9B59B6',
  Antarctica: '#95A5A6',
  Unknown: '#7F8C8D',
}
