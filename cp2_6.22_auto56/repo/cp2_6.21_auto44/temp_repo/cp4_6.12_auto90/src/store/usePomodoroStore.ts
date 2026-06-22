import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface PomodoroSession {
  id: string
  tagId: string
  startTime: number
  endTime: number
  duration: number
  sessionNumber: number
}

export interface Settings {
  workDuration: number
  breakDuration: number
  dailyGoal: number
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'break' | 'breakRunning'

interface PomodoroStore {
  tags: Tag[]
  sessions: PomodoroSession[]
  settings: Settings
  currentTagId: string | null
  timerStatus: TimerStatus
  showModal: boolean
  completedSession: PomodoroSession | null
  addTag: (name: string, color: string) => void
  logSession: (tagId: string, duration: number) => void
  updateSettings: (settings: Partial<Settings>) => void
  setCurrentTag: (tagId: string) => void
  setTimerStatus: (status: TimerStatus) => void
  setShowModal: (show: boolean) => void
  setCompletedSession: (session: PomodoroSession | null) => void
  getTodaySessions: () => PomodoroSession[]
  getTodaySessionCount: () => number
}

const defaultTags: Tag[] = [
  { id: '1', name: '编码', color: '#4ecdc4' },
  { id: '2', name: '阅读', color: '#ff6b6b' },
  { id: '3', name: '写作', color: '#a29bfe' },
  { id: '4', name: '冥想', color: '#fdcb6e' },
]

const defaultSettings: Settings = {
  workDuration: 25,
  breakDuration: 5,
  dailyGoal: 8,
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      tags: defaultTags,
      sessions: [],
      settings: defaultSettings,
      currentTagId: '1',
      timerStatus: 'idle',
      showModal: false,
      completedSession: null,

      addTag: (name: string, color: string) => {
        const { tags } = get()
        if (tags.length >= 6) return
        const newTag: Tag = {
          id: generateId(),
          name,
          color,
        }
        set({ tags: [...tags, newTag] })
      },

      logSession: (tagId: string, duration: number) => {
        const { sessions } = get()
        const now = Date.now()
        const todaySessions = get().getTodaySessions()
        const sessionNumber = todaySessions.length + 1

        const newSession: PomodoroSession = {
          id: generateId(),
          tagId,
          startTime: now - duration * 60 * 1000,
          endTime: now,
          duration,
          sessionNumber,
        }

        set({
          sessions: [...sessions, newSession],
          completedSession: newSession,
          showModal: true,
        })
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      setCurrentTag: (tagId: string) => {
        set({ currentTagId: tagId })
      },

      setTimerStatus: (status: TimerStatus) => {
        set({ timerStatus: status })
      },

      setShowModal: (show: boolean) => {
        set({ showModal: show })
      },

      setCompletedSession: (session: PomodoroSession | null) => {
        set({ completedSession: session })
      },

      getTodaySessions: () => {
        const { sessions } = get()
        const now = new Date()
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).getTime()
        return sessions.filter((s) => s.endTime >= todayStart)
      },

      getTodaySessionCount: () => {
        return get().getTodaySessions().length
      },
    }),
    {
      name: 'pomodoro-storage',
      partialize: (state) => ({
        tags: state.tags,
        sessions: state.sessions,
        settings: state.settings,
        currentTagId: state.currentTagId,
      }),
    }
  )
)
