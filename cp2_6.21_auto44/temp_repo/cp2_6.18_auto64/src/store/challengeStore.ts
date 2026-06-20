import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface Member {
  id: string
  name: string
  email: string
  avatar: string
}

export interface CheckInRecord {
  id: string
  memberId: string
  date: string
  description: string
  imageBase64: string
  completionAmount: number
}

export interface Challenge {
  id: string
  name: string
  durationDays: number
  dailyGoal: string
  dailyTargetAmount: number
  members: Member[]
  checkIns: CheckInRecord[]
  startDate: string
  createdAt: string
}

interface ChallengeState {
  currentChallenge: Challenge | null
  currentPage: 'create' | 'detail' | 'member'
  selectedMemberId: string | null

  createChallenge: (name: string, durationDays: number, dailyGoal: string, members: { email: string; name: string }[]) => string
  addCheckIn: (memberId: string, date: string, description: string, imageBase64: string, completionAmount: number) => void
  getMemberStats: (memberId: string) => { totalCheckIns: number; completionRate: number }
  getOverallCompletionRate: () => number
  getDaysPassed: () => number
  setCurrentPage: (page: 'create' | 'detail' | 'member') => void
  setSelectedMember: (memberId: string | null) => void
  getCheckInsByMember: (memberId: string) => CheckInRecord[]
  getCheckInByDate: (memberId: string, date: string) => CheckInRecord | undefined
  resetChallenge: () => void
}

const generateAvatar = (name: string) => {
  const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
  const colorIndex = name.charCodeAt(0) % colors.length
  return colors[colorIndex]
}

const generateDemoChallenge = (): Challenge => {
  const membersData = [
    { name: '张伟', email: 'zhangwei@example.com' },
    { name: '李娜', email: 'lina@example.com' },
    { name: '王强', email: 'wangqiang@example.com' },
    { name: '刘芳', email: 'liufang@example.com' },
    { name: '陈明', email: 'chenming@example.com' },
  ]

  const members: Member[] = membersData.map(m => ({
    id: uuidv4(),
    name: m.name,
    email: m.email,
    avatar: generateAvatar(m.name),
  }))

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 14)
  const startDateStr = startDate.toISOString().split('T')[0]

  const checkIns: CheckInRecord[] = []
  const descriptions = [
    '今天状态不错，完成得很轻松',
    '有点累，但还是坚持下来了',
    '分组完成，感觉良好',
    '今天加了点难度',
    '早起锻炼，精神满满',
    '下班后练的，稍显疲惫',
    '休息日也不能落下',
    '今天超额完成了',
    '和朋友一起打卡，更有动力',
  ]

  const completionRates = [0.85, 0.72, 0.93, 0.65, 0.78]

  members.forEach((member, memberIdx) => {
    const rate = completionRates[memberIdx]
    for (let i = 0; i < 14; i++) {
      if (Math.random() < rate) {
        const d = new Date(startDate)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]

        const baseAmount = Math.floor(60 + Math.random() * 50)
        const completionAmount = Math.min(100, baseAmount + (i > 7 ? 10 : 0))

        checkIns.push({
          id: uuidv4(),
          memberId: member.id,
          date: dateStr,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          imageBase64: '',
          completionAmount,
        })
      }
    }
  })

  return {
    id: uuidv4(),
    name: '30天俯卧撑挑战',
    durationDays: 30,
    dailyGoal: '每天完成100个俯卧撑，可以分组完成，重在坚持！',
    dailyTargetAmount: 100,
    members,
    checkIns,
    startDate: startDateStr,
    createdAt: startDate.toISOString(),
  }
}

const loadFromStorage = (): Challenge | null => {
  try {
    const stored = localStorage.getItem('fitpact_challenge')
    if (stored) {
      return JSON.parse(stored)
    }
    const demo = generateDemoChallenge()
    localStorage.setItem('fitpact_challenge', JSON.stringify(demo))
    return demo
  } catch {
    return generateDemoChallenge()
  }
}

const saveToStorage = (challenge: Challenge) => {
  try {
    localStorage.setItem('fitpact_challenge', JSON.stringify(challenge))
  } catch {
    console.warn('Failed to save challenge to localStorage')
  }
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  currentChallenge: loadFromStorage(),
  currentPage: 'detail',
  selectedMemberId: null,

  createChallenge: (name, durationDays, dailyGoal, memberEmails) => {
    const members: Member[] = memberEmails.map(m => ({
      id: uuidv4(),
      name: m.name || m.email.split('@')[0],
      email: m.email,
      avatar: generateAvatar(m.name || m.email),
    }))

    const challenge: Challenge = {
      id: uuidv4(),
      name,
      durationDays,
      dailyGoal,
      dailyTargetAmount: 100,
      members,
      checkIns: [],
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    }

    set({ currentChallenge: challenge, currentPage: 'detail' })
    saveToStorage(challenge)
    return challenge.id
  },

  addCheckIn: (memberId, date, description, imageBase64, completionAmount) => {
    const { currentChallenge } = get()
    if (!currentChallenge) return

    const existingIndex = currentChallenge.checkIns.findIndex(
      c => c.memberId === memberId && c.date === date
    )

    let newCheckIns: CheckInRecord[]
    const newRecord: CheckInRecord = {
      id: uuidv4(),
      memberId,
      date,
      description,
      imageBase64,
      completionAmount,
    }

    if (existingIndex >= 0) {
      newCheckIns = [...currentChallenge.checkIns]
      newCheckIns[existingIndex] = newRecord
    } else {
      newCheckIns = [...currentChallenge.checkIns, newRecord]
    }

    const updatedChallenge = { ...currentChallenge, checkIns: newCheckIns }
    set({ currentChallenge: updatedChallenge })
    saveToStorage(updatedChallenge)
  },

  getMemberStats: (memberId) => {
    const { currentChallenge, getDaysPassed } = get()
    if (!currentChallenge) return { totalCheckIns: 0, completionRate: 0 }

    const memberCheckIns = currentChallenge.checkIns.filter(c => c.memberId === memberId)
    const daysPassed = getDaysPassed()
    const completionRate = daysPassed > 0 ? (memberCheckIns.length / daysPassed) * 100 : 0

    return {
      totalCheckIns: memberCheckIns.length,
      completionRate: Math.min(100, Math.round(completionRate)),
    }
  },

  getOverallCompletionRate: () => {
    const { currentChallenge, getDaysPassed } = get()
    if (!currentChallenge || currentChallenge.members.length === 0) return 0

    const daysPassed = getDaysPassed()
    if (daysPassed === 0) return 0

    const totalExpected = daysPassed * currentChallenge.members.length
    const totalCheckIns = currentChallenge.checkIns.length

    return Math.min(100, Math.round((totalCheckIns / totalExpected) * 100))
  },

  getDaysPassed: () => {
    const { currentChallenge } = get()
    if (!currentChallenge) return 0

    const start = new Date(currentChallenge.startDate)
    const today = new Date()
    const diffTime = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

    return Math.max(0, Math.min(diffDays, currentChallenge.durationDays))
  },

  setCurrentPage: (page) => set({ currentPage: page, selectedMemberId: null }),

  setSelectedMember: (memberId) => {
    set({ selectedMemberId: memberId })
    if (memberId) {
      set({ currentPage: 'member' })
    }
  },

  getCheckInsByMember: (memberId) => {
    const { currentChallenge } = get()
    if (!currentChallenge) return []
    return currentChallenge.checkIns.filter(c => c.memberId === memberId)
  },

  getCheckInByDate: (memberId, date) => {
    const { currentChallenge } = get()
    if (!currentChallenge) return undefined
    return currentChallenge.checkIns.find(c => c.memberId === memberId && c.date === date)
  },

  resetChallenge: () => {
    localStorage.removeItem('fitpact_challenge')
    set({ currentChallenge: null, currentPage: 'create', selectedMemberId: null })
  },
}))
