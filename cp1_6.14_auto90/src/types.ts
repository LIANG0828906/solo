export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  dueDate: string
  completed: boolean
  createdAt: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  completedDates: string[]
  createdAt: string
}

export type TimerType = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerSession {
  id: string
  duration: number
  startedAt: string
  completedAt: string
  type: TimerType
}

export interface Settings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  dailyGoal: number
}

export interface BootstrapResponse {
  tasks: Task[]
  habits: Habit[]
  timerSessions: TimerSession[]
  settings: Settings
  checkedToday: string[]
}

export interface DailyTaskStat {
  date: string
  completed: number
  total: number
}

export interface DailyFocusStat {
  date: string
  minutes: number
}

export interface HabitDayStat {
  habitId: string
  habitName: string
  date: string
  checked: boolean
}
