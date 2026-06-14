import axios from 'axios'
import type {
  BootstrapResponse,
  Habit,
  Settings,
  Task,
  TimerSession,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export const apiClient = api

export function bootstrap(): Promise<BootstrapResponse> {
  return api.get<BootstrapResponse>('/bootstrap').then((r) => r.data)
}

export function getTasks(): Promise<Task[]> {
  return api.get<Task[]>('/tasks').then((r) => r.data)
}

export function createTask(payload: {
  title: string
  priority?: Task['priority']
  dueDate?: string
}): Promise<Task> {
  return api.post<Task>('/tasks', payload).then((r) => r.data)
}

export function updateTask(id: string, payload: Partial<Task>): Promise<Task> {
  return api.put<Task>(`/tasks/${id}`, payload).then((r) => r.data)
}

export function deleteTask(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/tasks/${id}`).then((r) => r.data)
}

export function getHabits(): Promise<Habit[]> {
  return api.get<Habit[]>('/habits').then((r) => r.data)
}

export function createHabit(payload: {
  name: string
  icon?: string
}): Promise<Habit> {
  return api.post<Habit>('/habits', payload).then((r) => r.data)
}

export function deleteHabit(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/habits/${id}`).then((r) => r.data)
}

export function checkHabit(
  id: string,
  date?: string,
  checked?: boolean,
): Promise<{ success: boolean; habit: Habit }> {
  return api
    .post<{ success: boolean; habit: Habit }>(`/habits/${id}/check`, {
      date,
      checked,
    })
    .then((r) => r.data)
}

export function getTimerSessions(
  range?: { start: string; end: string },
): Promise<TimerSession[]> {
  if (range) {
    return api
      .get<TimerSession[]>('/timer-sessions/range', { params: range })
      .then((r) => r.data)
  }
  return api.get<TimerSession[]>('/timer-sessions').then((r) => r.data)
}

export function createTimerSession(payload: {
  duration: number
  startedAt?: string
  completedAt?: string
  type: TimerSession['type']
}): Promise<TimerSession> {
  return api.post<TimerSession>('/timer-sessions', payload).then((r) => r.data)
}

export function getSettings(): Promise<Settings> {
  return api.get<Settings>('/settings').then((r) => r.data)
}

export function updateSettings(payload: Partial<Settings>): Promise<Settings> {
  return api.put<Settings>('/settings', payload).then((r) => r.data)
}
