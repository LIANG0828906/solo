export interface GameSettings {
  roundDuration: 60 | 90 | 120
  totalRounds: 2 | 4 | 6
  soundEnabled: boolean
}

export const DEFAULT_SETTINGS: GameSettings = {
  roundDuration: 90,
  totalRounds: 4,
  soundEnabled: true,
}

const STORAGE_KEY = 'poetry_duel_settings'

export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        roundDuration: [60, 90, 120].includes(parsed.roundDuration) ? parsed.roundDuration : DEFAULT_SETTINGS.roundDuration,
        totalRounds: [2, 4, 6].includes(parsed.totalRounds) ? parsed.totalRounds : DEFAULT_SETTINGS.totalRounds,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}
