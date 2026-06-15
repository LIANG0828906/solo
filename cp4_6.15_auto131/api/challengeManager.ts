import { v4 as uuidv4 } from 'uuid'

export interface Activity {
  id: string
  category: 'transport' | 'food' | 'electricity'
  name: string
  value: number
  carbonKg: number
}

export interface DailyRecord {
  id: string
  userId: string
  date: string
  activities: Activity[]
  totalCarbon: number
  level: 'low' | 'medium' | 'high'
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

export interface UserProfile {
  userId: string
  nickname: string
  avatar: string
  weeklyReduction: number
  badges: Badge[]
  challengeCount: number
}

export interface LeaderboardEntry {
  userId: string
  nickname: string
  avatar: string
  weeklyReduction: number
  badges: Badge[]
  rank: number
  prevRank: number
}

const users = new Map<string, UserProfile>()
const records = new Map<string, DailyRecord[]>()
const friendships: { from: string; to: string }[] = []

let broadcastCallback: ((data: unknown) => void) | null = null

function initMockUsers(): void {
  const mockData: Omit<UserProfile, 'badges' | 'challengeCount'>[] = [
    { userId: 'user_1', nickname: '小绿', avatar: '🌿', weeklyReduction: Math.round(Math.random() * 50 + 20) / 10 },
    { userId: 'user_2', nickname: '低碳达人', avatar: '🌱', weeklyReduction: Math.round(Math.random() * 50 + 20) / 10 },
    { userId: 'user_3', nickname: '环保侠', avatar: '🦸', weeklyReduction: Math.round(Math.random() * 50 + 20) / 10 },
    { userId: 'user_4', nickname: '碳中和君', avatar: '🌍', weeklyReduction: Math.round(Math.random() * 50 + 20) / 10 },
    { userId: 'user_5', nickname: '绿叶使者', avatar: '🍃', weeklyReduction: Math.round(Math.random() * 50 + 20) / 10 },
  ]

  for (const data of mockData) {
    users.set(data.userId, {
      ...data,
      badges: [],
      challengeCount: Math.floor(Math.random() * 10),
    })
    records.set(data.userId, [])
  }
}

initMockUsers()

function getLeaderboard(): LeaderboardEntry[] {
  const prevRanks = new Map<string, number>()
  const sorted = [...users.values()].sort((a, b) => b.weeklyReduction - a.weeklyReduction)

  const entries: LeaderboardEntry[] = sorted.map((user, index) => ({
    userId: user.userId,
    nickname: user.nickname,
    avatar: user.avatar,
    weeklyReduction: user.weeklyReduction,
    badges: user.badges,
    rank: index + 1,
    prevRank: prevRanks.get(user.userId) ?? index + 1,
  }))

  return entries
}

function checkAndAwardBadges(userId: string): Badge[] {
  const user = users.get(userId)
  if (!user) return []

  const newBadges: Badge[] = []
  const existingBadgeIds = new Set(user.badges.map(b => b.id))

  const userRecords = records.get(userId) ?? []
  const lowCarbonDays = userRecords.filter(r => r.level === 'low').length
  if (lowCarbonDays >= 7 && !existingBadgeIds.has('green_pioneer')) {
    const badge: Badge = { id: 'green_pioneer', name: '绿色先锋', description: '连续7天低碳出行', icon: '🏆' }
    newBadges.push(badge)
    user.badges.push(badge)
  }

  if (user.challengeCount >= 5 && !existingBadgeIds.has('challenge_master')) {
    const badge: Badge = { id: 'challenge_master', name: '挑战达人', description: '参与5次以上挑战', icon: '🎯' }
    newBadges.push(badge)
    user.badges.push(badge)
  }

  return newBadges
}

function generateAdvice(): string {
  const advices = [
    () => `今天少开一天车，减碳${(Math.random() * 5 + 1).toFixed(1)}kg，相当于种了${(Math.random() * 0.5 + 0.1).toFixed(1)}棵树！`,
    () => `选择公共交通出行，每次可减碳${(Math.random() * 3 + 0.5).toFixed(1)}kg，一起守护蓝天！`,
    () => `减少肉类摄入一天，减碳${(Math.random() * 2 + 0.5).toFixed(1)}kg，健康又环保！`,
    () => `随手关灯一小时，减碳${(Math.random() * 1 + 0.2).toFixed(1)}kg，小行动大改变！`,
    () => `使用节能电器，年减碳可达${(Math.random() * 100 + 50).toFixed(0)}kg，为地球降温！`,
    () => `骑行代替开车${(Math.random() * 10 + 5).toFixed(0)}公里，减碳${(Math.random() * 4 + 1).toFixed(1)}kg，还锻炼了身体！`,
  ]
  return advices[Math.floor(Math.random() * advices.length)]()
}

function submitRecord(userId: string, activities: Activity[]): { record: DailyRecord; advice: string; newBadges: Badge[] } {
  const totalCarbon = activities.reduce((sum, a) => sum + a.carbonKg, 0)
  const level: DailyRecord['level'] = totalCarbon < 3 ? 'low' : totalCarbon < 8 ? 'medium' : 'high'

  const record: DailyRecord = {
    id: uuidv4(),
    userId,
    date: new Date().toISOString().split('T')[0],
    activities: activities.map(a => ({ ...a, id: a.id || uuidv4() })),
    totalCarbon,
    level,
  }

  if (!records.has(userId)) {
    records.set(userId, [])
  }
  records.get(userId)!.push(record)

  const user = users.get(userId)
  if (user) {
    user.weeklyReduction = Math.round((user.weeklyReduction + (level === 'low' ? 1.5 : level === 'medium' ? 0.8 : 0.3)) * 10) / 10
    user.challengeCount += 1
  }

  const newBadges = checkAndAwardBadges(userId)
  const advice = generateAdvice()

  if (broadcastCallback) {
    broadcastCallback({ type: 'leaderboard_update', data: getLeaderboard() })
  }

  return { record, advice, newBadges }
}

function getUserProfile(userId: string): UserProfile | null {
  return users.get(userId) ?? null
}

function sendFriendRequest(from: string, to: string): boolean {
  const fromUser = users.get(from)
  const toUser = users.get(to)
  if (!fromUser || !toUser) return false

  const exists = friendships.some(f => f.from === from && f.to === to)
  if (exists) return false

  friendships.push({ from, to })
  return true
}

function getChallengeManager() {
  return {
    setBroadcastCallback(cb: (data: unknown) => void) {
      broadcastCallback = cb
    },
    getLeaderboard,
  }
}

export { getLeaderboard, submitRecord, getUserProfile, sendFriendRequest, getChallengeManager }
