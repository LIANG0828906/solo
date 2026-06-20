import { create } from 'zustand'
import { format } from 'date-fns'

export interface InterruptEvent {
  id: string
  timestamp: number
  reason: string
}

interface TimerState {
  isRunning: boolean
  isPaused: boolean
  targetDuration: number
  elapsedSeconds: number
  interrupts: InterruptEvent[]
  dailyFocusMinutes: Record<string, number>
  dailySessions: Record<string, number>
  dailyInterrupts: Record<string, number>
  setTargetDuration: (minutes: number) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tick: () => boolean
  completeSession: () => void
  addInterrupt: (reason: string) => void
  removeInterrupt: (id: string) => void
  resetTodayData: () => void
}

const getTodayKey = (): string => format(new Date(), 'yyyy-MM-dd')

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  targetDuration: 25 * 60,
  elapsedSeconds: 0,
  interrupts: loadFromStorage<InterruptEvent[]>('focus_interrupts', []),
  dailyFocusMinutes: loadFromStorage<Record<string, number>>(
    'focus_daily_minutes',
    {}
  ),
  dailySessions: loadFromStorage<Record<string, number>>(
    'focus_daily_sessions',
    {}
  ),
  dailyInterrupts: loadFromStorage<Record<string, number>>(
    'focus_daily_interrupts',
    {}
  ),

  setTargetDuration: (minutes: number) => {
    set({ targetDuration: minutes * 60, elapsedSeconds: 0 })
  },

  startTimer: () => {
    set({ isRunning: true, isPaused: false })
  },

  pauseTimer: () => {
    set({ isPaused: true })
  },

  resetTimer: () => {
    set({ isRunning: false, isPaused: false, elapsedSeconds: 0 })
  },

  tick: () => {
    const { elapsedSeconds, targetDuration, isRunning, isPaused } = get()
    if (!isRunning || isPaused) return false

    const newElapsed = elapsedSeconds + 1
    if (newElapsed >= targetDuration) {
      get().completeSession()
      return false
    }
    set({ elapsedSeconds: newElapsed })
    return true
  },

  completeSession: () => {
    const { targetDuration, dailyFocusMinutes, dailySessions } = get()
    const today = getTodayKey()
    const minutes = Math.round(targetDuration / 60)

    const newFocusMinutes = {
      ...dailyFocusMinutes,
      [today]: (dailyFocusMinutes[today] || 0) + minutes,
    }
    const newSessions = {
      ...dailySessions,
      [today]: (dailySessions[today] || 0) + 1,
    }

    saveToStorage('focus_daily_minutes', newFocusMinutes)
    saveToStorage('focus_daily_sessions', newSessions)

    set({
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      dailyFocusMinutes: newFocusMinutes,
      dailySessions: newSessions,
    })
  },

  addInterrupt: (reason: string) => {
    const { interrupts, dailyInterrupts } = get()
    const today = getTodayKey()

    const newInterrupt: InterruptEvent = {
      id: generateId(),
      timestamp: Date.now(),
      reason,
    }

    const newInterrupts = [newInterrupt, ...interrupts].slice(0, 50)
    const newDailyInterrupts = {
      ...dailyInterrupts,
      [today]: (dailyInterrupts[today] || 0) + 1,
    }

    saveToStorage('focus_interrupts', newInterrupts)
    saveToStorage('focus_daily_interrupts', newDailyInterrupts)

    set({
      interrupts: newInterrupts,
      dailyInterrupts: newDailyInterrupts,
    })
  },

  removeInterrupt: (id: string) => {
    const { interrupts } = get()
    const newInterrupts = interrupts.filter((e) => e.id !== id)
    saveToStorage('focus_interrupts', newInterrupts)
    set({ interrupts: newInterrupts })
  },

  resetTodayData: () => {
    const today = getTodayKey()
    const { dailyFocusMinutes, dailySessions, dailyInterrupts, interrupts } =
      get()

    const newFocusMinutes = { ...dailyFocusMinutes }
    delete newFocusMinutes[today]
    const newSessions = { ...dailySessions }
    delete newSessions[today]
    const newInterrupts = { ...dailyInterrupts }
    delete newInterrupts[today]

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startOfDayTs = startOfDay.getTime()
    const filteredInterrupts = interrupts.filter(
      (e) => e.timestamp < startOfDayTs
    )

    saveToStorage('focus_daily_minutes', newFocusMinutes)
    saveToStorage('focus_daily_sessions', newSessions)
    saveToStorage('focus_daily_interrupts', newInterrupts)
    saveToStorage('focus_interrupts', filteredInterrupts)

    set({
      dailyFocusMinutes: newFocusMinutes,
      dailySessions: newSessions,
      dailyInterrupts: newInterrupts,
      interrupts: filteredInterrupts,
    })
  },
}))
