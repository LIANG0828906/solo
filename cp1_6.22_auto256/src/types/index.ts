export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type SportType = 'cycling' | 'hiking' | 'running' | 'climbing'
export type TeamStatus = 'recruiting' | 'voting' | 'confirmed' | 'cancelled'
export type VoteOptionType = 'time' | 'route' | 'cancel'

export interface User {
  id: string
  name: string
  avatarColor: string
  fitnessLevel: FitnessLevel
  preferences: SportType[]
  locationRadius: number
}

export interface WeatherData {
  date: 'saturday' | 'sunday'
  timeSlot: 'morning' | 'afternoon' | 'evening'
  temperature: number
  precipitation: number
  windLevel: number
}

export interface SportItem {
  id: string
  name: string
  type: SportType
  duration: number
  difficulty: 1 | 2 | 3 | 4 | 5
  suitableFitness: FitnessLevel[]
  weatherConstraints: {
    maxPrecipitation: number
    minTemperature: number
    maxTemperature: number
    maxWindLevel: number
  }
}

export interface RecommendedPlan {
  id: string
  sport: SportItem
  weather: WeatherData
  score: number
  weatherMatch: number
}

export interface TeamMember {
  userId: string
  userName: string
  avatarColor: string
  joinedAt: number
}

export interface VoteOption {
  id: string
  type: VoteOptionType
  label: string
  value: string
}

export interface Vote {
  id: string
  teamId: string
  options: VoteOption[]
  startTime: number
  endTime: number
  votes: { [optionId: string]: string[] }
  result?: VoteOption
}

export interface Team {
  id: string
  planId: string
  inviteCode: string
  leaderId: string
  members: TeamMember[]
  maxMembers: number
  status: TeamStatus
  vote?: Vote
  createdAt: number
}

export interface PlanHistory {
  id: string
  userId: string
  plan: RecommendedPlan
  team: Team
  finalRoute?: string
  finalTime?: string
  completedAt: number
}

export const AVATAR_COLORS = [
  '#FF4757',
  '#1E90FF',
  '#2ED573',
  '#FFA502',
  '#A55EEA'
]

export const FITNESS_LEVEL_LABELS: Record<FitnessLevel, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级'
}

export const SPORT_TYPE_LABELS: Record<SportType, string> = {
  cycling: '骑行',
  hiking: '徒步',
  running: '跑步',
  climbing: '登山'
}

export const TIME_SLOT_LABELS: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '傍晚'
}

export const DATE_LABELS: Record<string, string> = {
  saturday: '周六',
  sunday: '周日'
}
