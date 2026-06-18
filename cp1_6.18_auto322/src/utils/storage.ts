import type { AppState } from '@/store'

const STORAGE_KEY = 'music_portfolio_data'

export function saveToStorage(state: AppState): void {
  try {
    const data = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, data)
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function loadFromStorage(): AppState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data) as AppState
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
    return null
  }
}

export function exportToJson(state: AppState): void {
  try {
    const dataStr = JSON.stringify(state, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `music-portfolio-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Failed to export data:', e)
  }
}

export function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 60%, 50%)`
}

export function randomLightColor(): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 85%)`
}

export function randomDarkColor(): string {
  const value = Math.floor(Math.random() * 34) + 51
  const hex = value.toString(16).padStart(2, '0')
  return `#${hex}${hex}${hex}`
}

export function getInitials(name: string): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
