import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

export type TimerMode = 'idle' | 'focus' | 'break'

export type UserStatus = 'focusing' | 'resting' | 'offline'

export interface User {
  id: string
  nickname: string
  status: UserStatus
  consecutiveDays: number
  totalMinutes: number
  todayMinutes: number
}

interface AppStateContextType {
  timerMode: TimerMode
  setTimerMode: (mode: TimerMode) => void
  focusDuration: number
  setFocusDuration: (d: number) => void
  breakDuration: number
  setBreakDuration: (d: number) => void
  currentTimeLeft: number
  setCurrentTimeLeft: (t: number) => void
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  currentUser: User | null
  updateUserStatus: (id: string, status: UserStatus) => void
  addFocusMinutes: (id: string, minutes: number) => void
  sortedUsers: User[]
  onlineCount: number
  showSummary: boolean
  setShowSummary: (s: boolean) => void
  lastSessionMinutes: number
  setLastSessionMinutes: (m: number) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

const NICKNAMES = [
  '月光下的猫', '星河漫步者', '书山有路', '墨染青衫', '清风徐来',
  '逐梦少年', '晨光熹微', '暮色温柔', '静水流深', '云淡风轻',
  '浮生若梦', '听雨轩', '暖阳如初', '叶落知秋', '半夏时光'
]

function generateRandomUsers(count: number): User[] {
  const shuffled = [...NICKNAMES].sort(() => Math.random() - 0.5)
  const statuses: UserStatus[] = ['focusing', 'focusing', 'focusing', 'resting', 'offline']
  return Array.from({ length: count }, (_, i) => {
    const consecutiveDays = Math.floor(Math.random() * 14) + 1
    const totalMinutes = Math.floor(Math.random() * 3000) + 120
    return {
      id: uuidv4(),
      nickname: shuffled[i % shuffled.length] + (i >= shuffled.length ? (i + 1) : ''),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      consecutiveDays,
      totalMinutes,
      todayMinutes: Math.min(totalMinutes, Math.floor(Math.random() * 300) + 15)
    }
  })
}

function createCurrentUser(): User {
  return {
    id: 'current-user-' + uuidv4(),
    nickname: '我',
    status: 'offline',
    consecutiveDays: 0,
    totalMinutes: 0,
    todayMinutes: 0
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [timerMode, setTimerMode] = useState<TimerMode>('idle')
  const [focusDuration] = useState(25 * 60)
  const [breakDuration] = useState(5 * 60)
  const [currentTimeLeft, setCurrentTimeLeft] = useState(25 * 60)
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [lastSessionMinutes, setLastSessionMinutes] = useState(0)

  useEffect(() => {
    const loadStart = Date.now()
    const savedUsers = localStorage.getItem('study_room_users')
    const savedCurrentUser = localStorage.getItem('study_room_current_user')

    let loadedUsers: User[]
    let loadedCurrent: User

    if (savedUsers) {
      try { loadedUsers = JSON.parse(savedUsers) }
      catch { loadedUsers = generateRandomUsers(10) }
    } else {
      loadedUsers = generateRandomUsers(10)
    }

    if (savedCurrentUser) {
      try { loadedCurrent = JSON.parse(savedCurrentUser) }
      catch { loadedCurrent = createCurrentUser() }
    } else {
      loadedCurrent = createCurrentUser()
    }

    const elapsed = Date.now() - loadStart
    const delay = Math.max(0, 500 - elapsed)

    setTimeout(() => {
      setUsers([loadedCurrent, ...loadedUsers])
      setCurrentUser(loadedCurrent)
    }, delay)
  }, [])

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('study_room_users', JSON.stringify(users.filter(u => u.id !== currentUser?.id)))
    }
    if (currentUser) {
      localStorage.setItem('study_room_current_user', JSON.stringify(currentUser))
    }
  }, [users, currentUser])

  const updateUserStatus = useCallback((id: string, status: UserStatus) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
    if (id === currentUser?.id) {
      setCurrentUser(prev => prev ? { ...prev, status } : prev)
    }
  }, [currentUser?.id])

  const addFocusMinutes = useCallback((id: string, minutes: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u
      const newToday = u.todayMinutes + minutes
      const newTotal = u.totalMinutes + minutes
      const newConsecutive = u.status === 'focusing' && minutes >= 25 ? u.consecutiveDays + 1 : u.consecutiveDays
      return { ...u, todayMinutes: newToday, totalMinutes: newTotal, consecutiveDays: newConsecutive }
    }))
    setCurrentUser(prev => {
      if (!prev || prev.id !== id) return prev
      const newToday = prev.todayMinutes + minutes
      const newTotal = prev.totalMinutes + minutes
      const newConsecutive = prev.status === 'focusing' && minutes >= 25 ? prev.consecutiveDays + 1 : prev.consecutiveDays
      return { ...prev, todayMinutes: newToday, totalMinutes: newTotal, consecutiveDays: newConsecutive }
    })
  }, [])

  const sortedUsers = [...users].sort((a, b) => b.totalMinutes - a.totalMinutes)

  const onlineCount = users.filter(u => u.status !== 'offline').length

  return (
    <AppStateContext.Provider value={{
      timerMode, setTimerMode,
      focusDuration, setFocusDuration: () => {},
      breakDuration, setBreakDuration: () => {},
      currentTimeLeft, setCurrentTimeLeft,
      users, setUsers,
      currentUser,
      updateUserStatus,
      addFocusMinutes,
      sortedUsers,
      onlineCount,
      showSummary, setShowSummary,
      lastSessionMinutes, setLastSessionMinutes
    }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
