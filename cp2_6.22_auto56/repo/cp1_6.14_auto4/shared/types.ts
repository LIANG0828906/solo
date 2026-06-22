/**
 * 【文件职责】共享类型定义，前后端共用的核心领域模型
 * 【被调用方】api/db.ts、api/routes/auth.ts、api/routes/matches.ts、api/utils/matching.ts、
 *             src/utils/api.ts、src/store/sessionStore.ts、所有页面与组件
 * 【数据流向】所有模块通过 import 引入本文件类型 → 编译期类型校验 → 保证前后端数据结构一致
 */

export type Position = '后卫' | '前锋' | '中锋'
export type Level = '新人' | '进阶' | '高手'
export type MatchMode = '3v3' | '5v5'
export type MatchStatus = 'open' | 'closed' | 'canceled' | 'finished'
export type MatchRole = 'creator' | 'player'
export type MatchResult = '胜' | '负' | '平' | ''

export interface User {
  id: string
  nickname: string
  position: Position
  level: Level
  password: string
}

export interface Match {
  id: string
  title: string
  mode: MatchMode
  date: string
  time: string
  location: string
  note: string
  creatorId: string
  playerIds: string[]
  status: MatchStatus
  result: MatchResult
  comment: string
  createdAt: string
}

export interface MatchHistory {
  userId: string
  matchId: string
  role: MatchRole
  result: MatchResult
  comment: string
  playedAt: string
}

export interface DatabaseSchema {
  users: User[]
  matches: Match[]
  history: MatchHistory[]
}

export interface MatchPositionRequirement {
  position: Position
  required: number
}

/**
 * 各模式下的理想位置配置：
 * 3v3：后卫1 + 前锋1 + 中锋1
 * 5v5：后卫2 + 前锋2 + 中锋1
 */
export const POSITION_REQUIREMENTS: Record<MatchMode, MatchPositionRequirement[]> = {
  '3v3': [
    { position: '后卫', required: 1 },
    { position: '前锋', required: 1 },
    { position: '中锋', required: 1 },
  ],
  '5v5': [
    { position: '后卫', required: 2 },
    { position: '前锋', required: 2 },
    { position: '中锋', required: 1 },
  ],
}

export const LEVEL_ORDER: Record<Level, number> = {
  '新人': 1,
  '进阶': 2,
  '高手': 3,
}

export const POSITION_LIST: Position[] = ['后卫', '前锋', '中锋']
export const LEVEL_LIST: Level[] = ['新人', '进阶', '高手']
