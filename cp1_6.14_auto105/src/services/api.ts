import axios from 'axios'
import type { TravelMarker, TravelStats, ReverseGeocodeResult, MoodType } from '@/types'
import { getMarkersFromStorage, saveMarkersToStorage, generateId } from '@/utils/storage'
import { getContinentByCountryCode, getContinentByLatLng } from '@/utils/geo'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        format: 'json',
        lat,
        lon: lng,
        zoom: 10,
        addressdetails: 1,
        'accept-language': 'zh-CN',
      },
      timeout: 10000,
    })

    const data = response.data
    const address = data.address || {}

    let city =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state ||
      '未知地点'

    const country = address.country || '未知国家'
    const countryCode = address.country_code?.toUpperCase() || ''

    let continent = getContinentByCountryCode(countryCode)
    if (continent === 'Unknown') {
      continent = getContinentByLatLng(lat, lng)
    }

    return { city, country, continent }
  } catch (error) {
    console.warn('反向地理编码失败，使用默认值:', error)
    return {
      city: '未知地点',
      country: '未知国家',
      continent: getContinentByLatLng(lat, lng),
    }
  }
}

export function getMarkers(): TravelMarker[] {
  return getMarkersFromStorage()
}

export function addMarker(
  marker: Omit<TravelMarker, 'id' | 'createdAt'>
): TravelMarker {
  const markers = getMarkersFromStorage()
  const newMarker: TravelMarker = {
    ...marker,
    id: generateId(),
    createdAt: Date.now(),
  }
  markers.push(newMarker)
  saveMarkersToStorage(markers)
  return newMarker
}

export function updateMarker(
  id: string,
  data: Partial<TravelMarker>
): TravelMarker | null {
  const markers = getMarkersFromStorage()
  const index = markers.findIndex((m) => m.id === id)
  if (index === -1) return null

  markers[index] = { ...markers[index], ...data }
  saveMarkersToStorage(markers)
  return markers[index]
}

export function deleteMarker(id: string): boolean {
  const markers = getMarkersFromStorage()
  const newMarkers = markers.filter((m) => m.id !== id)
  if (newMarkers.length === markers.length) return false
  saveMarkersToStorage(newMarkers)
  return true
}

export function getStats(): TravelStats {
  const markers = getMarkersFromStorage()

  const countryMap = new Map<string, { count: number; continent: string }>()
  const cityMap = new Map<string, { count: number; country: string }>()
  const yearMap = new Map<number, number>()
  const monthMap = new Map<string, number>()

  markers.forEach((marker) => {
    const countryKey = marker.country
    if (!countryMap.has(countryKey)) {
      countryMap.set(countryKey, { count: 0, continent: marker.continent })
    }
    const countryData = countryMap.get(countryKey)!
    countryData.count++

    const cityKey = `${marker.city},${marker.country}`
    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, { count: 0, country: marker.country })
    }
    const cityData = cityMap.get(cityKey)!
    cityData.count++

    const date = new Date(marker.date)
    const year = date.getFullYear()
    yearMap.set(year, (yearMap.get(year) || 0) + 1)

    const monthKey = `${year}-${date.getMonth()}`
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
  })

  const yearlyData = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year)

  const monthlyData: { year: number; month: number; count: number }[] = []
  monthMap.forEach((count, key) => {
    const [year, month] = key.split('-').map(Number)
    monthlyData.push({ year, month, count })
  })
  monthlyData.sort((a, b) => a.year - b.year || a.month - b.month)

  const topCities = Array.from(cityMap.entries())
    .map(([key, data]) => {
      const city = key.split(',')[0]
      return { city, count: data.count, country: data.country }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const countryCounts = Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      count: data.count,
      continent: data.continent,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalCountries: countryMap.size,
    totalCities: cityMap.size,
    totalMarkers: markers.length,
    yearlyData,
    monthlyData,
    topCities,
    countryCounts,
  }
}

export function getMoodType(value: string): MoodType {
  const validMoods: MoodType[] = ['happy', 'calm', 'excited', 'tired']
  return validMoods.includes(value as MoodType) ? (value as MoodType) : 'happy'
}
