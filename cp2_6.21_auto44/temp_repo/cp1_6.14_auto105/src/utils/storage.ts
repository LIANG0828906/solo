import type { TravelMarker } from '@/types'

const STORAGE_KEY = 'travel_markers'

export function getMarkersFromStorage(): TravelMarker[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveMarkersToStorage(markers: TravelMarker[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers))
  } catch (e) {
    console.error('Failed to save markers to localStorage:', e)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
