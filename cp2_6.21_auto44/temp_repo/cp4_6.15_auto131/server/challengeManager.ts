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
  lowCarbonStreak: number
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
const friendships: { from: string; to: string; status: 'pending' | 'accepted' }[] = []

let broadcastCallback: ((data: unknown) => void) | null = null

function initMockUsers(): void {
  const mockData: Omit<UserProfile, 'badges' | 'challengeCount' | 'lowCarbonStreak'>[] = [
    { userId: 'user_1', nickname: '小绿', avatar: '🌿', weeklyReduction: 32.5 },
    { userId: 'user_2', nickname: '低碳达人', avatar: '🌱', weeklyReduction: 28.3 },
    { userId: 'user_3', nickname: '环保侠', avatar: '🦸', weeklyReduction: 24.7 },
    { userId: 'user_4', nickname: '碳中和君', avatar: '🌍', weeklyReduction: 21.1 },
    { userId: 'user_5', nickname: '绿叶使者', avatar: '🍃', weeklyReduction: 18.6 },
    { userId: 'user_6', nickname: '森林精灵', avatar: '🧚', weeklyReduction: 15.4 },
    { userId: 'user_7', nickname: '节能先锋', avatar: '⚡', weeklyReduction: 12.8 },
  ]

  for (const data of mockData) {
    const challengeCount = Math.floor(Math.random() * 8) + 2
    const lowCarbonStreak = Math.floor(Math.random() * 10)
    const badges: Badge[] = []
    if (lowCarbonStreak >= 7) {
      badges.push({ id: 'green_pioneer', name: '绿色先锋', description: '连续7天低碳', icon: '🏆' })
    }
    if (challengeCount >= 5) {
      badges.push({ id: 'challenge_master', name: '挑战达人', description: '参与5次挑战', icon: '🎯' })
    }
    users.set(data.userId, {
      ...data,
      badges,
      challengeCount,
      lowCarbonStreak,
    })
    records.set(data.userId, [])
  }
}

initMockUsers()

function getLeaderboard(): LeaderboardEntry[] {
  const sorted = [...users.values()].sort((a, b) => b.weeklyReduction - a.weeklyReduction)

  const entries: LeaderboardEntry[] = sorted.map((user, index) => ({
    userId: user.userId,
    nickname: user.nickname,
    avatar: user.avatar,
    weeklyReduction: user.weeklyReduction,
    badges: user.badges,
    rank: index + 1,
    prevRank: index + 1,
  }))

  return entries
}

function checkAndAwardBadges(userId: string): Badge[] {
  const user = users.get(userId)
  if (!user) return []

  const newBadges: Badge[] = []
  const existingBadgeIds = new Set(user.badges.map(b => b.id))

  if (user.lowCarbonStreak >= 7 && !existingBadgeIds.has('green_pioneer')) {
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

function generateAdvice(totalCarbon: number, level: string): string {
  const lowAdvices = [
    () => `今天做得真棒！减碳${totalCarbon.toFixed(1)}kg，相当于种了${(totalCarbon * 0.05).toFixed(1)}棵树！`,
    () => `低碳达人就是你！今天排放${totalCarbon.toFixed(1)}kg，继续保持这份绿色生活！🌿`,
    () => `太厉害了！今日碳排${totalCarbon.toFixed(1)}kg，为地球降温出了一份力！`,
  ]
  const mediumAdvices = [
    () => `今天碳排${totalCarbon.toFixed(1)}kg，如果明天试试公交出行，可以再减碳约2kg哦！`,
    () => `今日${totalCarbon.toFixed(1)}kg CO₂，试试减少一顿红肉，能减碳约3kg！`,
    () => `中等水平！再努努力，每天少开一天车，减碳2-3kg不在话下~`,
  ]
  const highAdvices = [
    () => `今天碳排${totalCarbon.toFixed(1)}kg有点高哦，试试骑行或公共交通出行吧！`,
    () => `今日${totalCarbon.toFixed(1)}kg，换成素食一天能减少约5kg碳排放~`,
    () => `高碳预警⚠️ 随手关灯、少开空调，轻松减碳从点滴做起！`,
  ]

  const pool = level === 'low' ? lowAdvices : level === 'medium' ? mediumAdvices : highAdvices
  return pool[Math.floor(Math.random() * pool.length)]()
}

function submitRecord(userId: string, activities: Activity[]): { record: DailyRecord; advice: string; newBadges: Badge[]; leaderboard: LeaderboardEntry[] } {
  const totalCarbon = activities.reduce((sum, a) => sum + a.carbonKg, 0)
  const level: DailyRecord['level'] = totalCarbon <= 5 ? 'low' : totalCarbon <= 10 ? 'medium' : 'high'

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
    if (level === 'low') {
      user.lowCarbonStreak += 1
    } else {
      user.lowCarbonStreak = 0
    }
    user.challengeCount += 1
    const reduction = level === 'low' ? 2.5 : level === 'medium' ? 1.0 : 0.3
    user.weeklyReduction = Math.round((user.weeklyReduction + reduction) * 10) / 10
  }

  const newBadges = checkAndAwardBadges(userId)
  const advice = generateAdvice(totalCarbon, level)
  const leaderboard = getLeaderboard()

  if (broadcastCallback) {
    broadcastCallback({ type: 'rank_change', data: leaderboard })
  }

  return { record, advice, newBadges, leaderboard }
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

  friendships.push({ from, to, status: 'pending' })
  return true
}

function getChallengeManager() {
  return {
    setBroadcastCallback(cb: (data: unknown) => void) {
      broadcastCallback = cb
    },
    getLeaderboard,
    submitRecord,
  }
}

export { getLeaderboard, submitRecord, getUserProfile, sendFriendRequest, getChallengeManager }
