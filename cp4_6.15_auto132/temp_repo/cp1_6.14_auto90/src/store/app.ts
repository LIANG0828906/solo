import { create } from 'zustand'
import type { Habit, Settings, Task, TimerSession } from '@/types'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface AppState {
  tasks: Task[]
  habits: Habit[]
  timerSessions: TimerSession[]
  settings: Settings
  loading: boolean
  toasts: ToastItem[]
  setTasks: (t: Task[]) => void
  setHabits: (h: Habit[]) => void
  setTimerSessions: (s: TimerSession[]) => void
  setSettings: (s: Settings) => void
  setLoading: (l: boolean) => void
  addTask: (t: Task) => void
  updateTask: (t: Task) => void
  removeTask: (id: string) => void
  addHabit: (h: Habit) => void
  removeHabit: (id: string) => void
  updateHabit: (h: Habit) => void
  addTimerSession: (s: TimerSession) => void
  pushToast: (message: string, type?: 'success' | 'error') => void
  removeToast: (id: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  tasks: [],
  habits: [],
  timerSessions: [],
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    dailyGoal: 8,
  },
  loading: true,
  toasts: [],
  setTasks: (t) => set({ tasks: t }),
  setHabits: (h) => set({ habits: h }),
  setTimerSessions: (s) => set({ timerSessions: s }),
  setSettings: (s) => set({ settings: s }),
  setLoading: (l) => set({ loading: l }),
  addTask: (t) => set((state) => ({ tasks: [t, ...state.tasks] })),
  updateTask: (t) =>
    set((state) => ({
      tasks: state.tasks.map((x) => (x.id === t.id ? t : x)),
    })),
  removeTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((x) => x.id !== id) })),
  addHabit: (h) => set((state) => ({ habits: [...state.habits, h] })),
  removeHabit: (id) =>
    set((state) => ({ habits: state.habits.filter((x) => x.id !== id) })),
  updateHabit: (h) =>
    set((state) => ({
      habits: state.habits.map((x) => (x.id === h.id ? h : x)),
    })),
  addTimerSession: (s) =>
    set((state) => ({ timerSessions: [...state.timerSessions, s] })),
  pushToast: (message, type = 'success') => {
    const id = Date.now() + Math.random()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) }))
    }, 2200)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) })),
}))
