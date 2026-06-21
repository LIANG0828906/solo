import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  name: string
  city: string
  timezone: string
  utcOffset: number
  workStart: string
  workEnd: string
  online: boolean
}

export interface Schedule {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: string[]
  color: string
}

export interface ChatMessage {
  id: string
  scheduleId: string
  userId: string
  content: string
  timestamp: string
  type: 'text' | 'emoji'
}

const users = new Map<string, User>()
const schedules = new Map<string, Schedule>()
const messages = new Map<string, ChatMessage[]>()

export function getAllUsers(): User[] {
  return Array.from(users.values())
}

export function getUser(id: string): User | undefined {
  return users.get(id)
}

export function addUser(data: Omit<User, 'id' | 'online'>): User {
  const user: User = {
    id: uuidv4(),
    online: true,
    ...data,
  }
  users.set(user.id, user)
  return user
}

export function deleteUser(id: string): boolean {
  return users.delete(id)
}

export function getAllSchedules(): Schedule[] {
  return Array.from(schedules.values())
}

export function getSchedule(id: string): Schedule | undefined {
  return schedules.get(id)
}

export function addSchedule(data: Omit<Schedule, 'id' | 'color'>): Schedule {
  let color = '#DBEAFE'
  if (data.participantIds.length >= 7) {
    color = '#FEE2E2'
  } else if (data.participantIds.length >= 4) {
    color = '#FED7AA'
  }
  const schedule: Schedule = {
    id: uuidv4(),
    color,
    ...data,
  }
  schedules.set(schedule.id, schedule)
  return schedule
}

export function deleteSchedule(id: string): boolean {
  messages.delete(id)
  return schedules.delete(id)
}

export function getMessages(scheduleId: string): ChatMessage[] {
  return messages.get(scheduleId) || []
}

export function addMessage(data: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const msg: ChatMessage = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...data,
  }
  const existing = messages.get(msg.scheduleId) || []
  existing.push(msg)
  messages.set(msg.scheduleId, existing)
  return msg
}
