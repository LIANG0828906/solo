const PLAYBACK_PROGRESS_KEY = 'playback_progress'
const LISTENING_HISTORY_KEY = 'listening_history'

interface ListeningRecord {
  date: string
  minutes: number
}

export function savePlaybackProgress(episodeId: string, progress: number): void {
  const data = JSON.parse(localStorage.getItem(PLAYBACK_PROGRESS_KEY) || '{}')
  data[episodeId] = progress
  localStorage.setItem(PLAYBACK_PROGRESS_KEY, JSON.stringify(data))
}

export function getPlaybackProgress(episodeId: string): number {
  const data = JSON.parse(localStorage.getItem(PLAYBACK_PROGRESS_KEY) || '{}')
  return data[episodeId] || 0
}

export function saveListeningMinutes(minutes: number): void {
  const today = new Date().toISOString().split('T')[0]
  const history: ListeningRecord[] = JSON.parse(
    localStorage.getItem(LISTENING_HISTORY_KEY) || '[]',
  )

  const existingIndex = history.findIndex((r) => r.date === today)
  if (existingIndex >= 0) {
    history[existingIndex].minutes += minutes
  } else {
    history.push({ date: today, minutes })
  }

  localStorage.setItem(LISTENING_HISTORY_KEY, JSON.stringify(history))
}

export function getListeningHistory(days: number): ListeningRecord[] {
  const history: ListeningRecord[] = JSON.parse(
    localStorage.getItem(LISTENING_HISTORY_KEY) || '[]',
  )

  const result: ListeningRecord[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const record = history.find((r) => r.date === dateStr)
    result.push({ date: dateStr, minutes: record?.minutes || 0 })
  }

  return result
}
