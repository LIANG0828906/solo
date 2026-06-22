import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { FlagData, useStore } from './useStore'

const API_BASE = '/api/flags'

export async function fetchFlags(): Promise<FlagData[]> {
  try {
    const res = await axios.get<FlagData[]>(API_BASE)
    return res.data
  } catch {
    return []
  }
}

export async function saveFlag(
  x: number,
  y: number,
  z: number,
  color: string
): Promise<FlagData | null> {
  try {
    const timestamp = Date.now()
    const id = uuidv4()
    const res = await axios.post<{ success: boolean; id: string; timestamp: number }>(API_BASE, {
      x,
      y,
      z,
      color,
    })
    if (res.data.success) {
      return { id: res.data.id || id, x, y, z, color, timestamp: res.data.timestamp || timestamp }
    }
    return null
  } catch {
    return null
  }
}

export async function clearFlagsRemote(): Promise<boolean> {
  try {
    const res = await axios.delete<{ success: boolean; cleared: number }>(API_BASE)
    return res.data.success
  } catch {
    return false
  }
}

export function useFlagReplay() {
  const { flags, isReplaying, replayIndex, advanceReplay, stopReplay, visibleFlags } = useStore()

  const startReplay = () => {
    const store = useStore.getState()
    store.startReplay()
  }

  const scheduleReplay = () => {
    startReplay()
    const sorted = [...useStore.getState().flags].sort((a, b) => a.timestamp - b.timestamp)
    if (sorted.length === 0) return

    const baseTime = sorted[0].timestamp
    const REPLAY_SPEED = 800

    sorted.forEach((flag, index) => {
      const relativeDelay = Math.max(0, flag.timestamp - baseTime)
      const delay = index * REPLAY_SPEED + Math.min(relativeDelay * 0.1, REPLAY_SPEED * 2)

      setTimeout(() => {
        const currentStore = useStore.getState()
        if (currentStore.isReplaying) {
          currentStore.advanceReplay()
        }
      }, delay)
    })

    const totalDelay = sorted.length * REPLAY_SPEED + 1000
    setTimeout(() => {
      const currentStore = useStore.getState()
      if (currentStore.isReplaying) {
        currentStore.stopReplay()
      }
    }, totalDelay)
  }

  return {
    flags,
    visibleFlags,
    isReplaying,
    replayIndex,
    startReplay: scheduleReplay,
    stopReplay,
  }
}
