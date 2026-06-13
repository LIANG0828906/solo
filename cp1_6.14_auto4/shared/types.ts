export type Position = '前锋' | '中锋' | '后卫'

export type SkillLevel = '新人' | '进阶' | '高手'

export interface User {
  id: string
  name: string
  position: Position
  skillLevel: SkillLevel
}

export interface Match {
  id: string
  title: string
  matchType: '3v3' | '5v5'
  creatorId: string
  enrolledUserIds: string[]
}

export interface MatchPositionRequirement {
  position: Position
  required: number
}

export const POSITION_REQUIREMENTS: Record<'3v3' | '5v5', MatchPositionRequirement[]> = {
  '3v3': [
    { position: '前锋', required: 1 },
    { position: '中锋', required: 1 },
    { position: '后卫', required: 1 },
  ],
  '5v5': [
    { position: '前锋', required: 2 },
    { position: '中锋', required: 1 },
    { position: '后卫', required: 2 },
  ],
}

export const SKILL_LEVEL_ORDER: Record<SkillLevel, number> = {
  '新人': 1,
  '进阶': 2,
  '高手': 3,
}

export interface RecommendationResult {
  user: User
  score: number
  reasons: string[]
}
