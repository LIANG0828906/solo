/**
 * 【文件职责】智能匹配算法模块，根据赛事位置缺口、段位契合度和阵容均衡性为赛事推荐最合适的候选球员
 * 【被调用方】api/routes/matches.ts 的 GET /matches/:id/recommend 接口
 * 【数据流向】接收 Match 赛事对象和 User[] 全部用户 → 计算位置缺口/段位差/均衡性 → 加权评分排序 → 返回 RecommendationResult[]
 */

import type { Match, User, Position, Level, MatchMode } from '../../shared/types.js'
import { POSITION_REQUIREMENTS, LEVEL_ORDER, POSITION_LIST } from '../../shared/types.js'

/**
 * 推荐结果结构
 */
export interface RecommendationResult {
  user: User
  score: number
  reasons: string[]
}

const POSITION_WEIGHT = 60
const LEVEL_WEIGHT = 30
const BALANCE_WEIGHT = 10

/**
 * 获取指定模式下的最大参赛人数
 * @param mode 赛事模式
 * @returns 最大人数
 */
function getMaxPlayers(mode: MatchMode): number {
  return mode === '3v3' ? 3 : 5
}

/**
 * 计算每个位置的当前人数
 * @param users 已报名用户列表
 * @returns 各位置人数映射
 */
function getCurrentPositionCounts(users: User[]): Record<Position, number> {
  const counts: Record<Position, number> = { 后卫: 0, 前锋: 0, 中锋: 0 }
  users.forEach((u) => {
    counts[u.position] += 1
  })
  return counts
}

/**
 * 计算每个位置的缺口（需求数 - 当前数，不足则为0）
 * @param mode 赛事模式
 * @param currentCounts 当前各位置人数
 * @returns 各位置缺口映射
 */
function getPositionGaps(
  mode: MatchMode,
  currentCounts: Record<Position, number>
): Record<Position, number> {
  const requirements = POSITION_REQUIREMENTS[mode]
  const gaps: Record<Position, number> = { 后卫: 0, 前锋: 0, 中锋: 0 }
  requirements.forEach((req) => {
    gaps[req.position] = Math.max(0, req.required - currentCounts[req.position])
  })
  return gaps
}

/**
 * 计算位置得分（满分60）
 * gap > 0 的位置：按缺口比例给分，缺口越大分越高；gap = 0 的位置给最低档分
 * @param candidatePosition 候选者位置
 * @param gaps 各位置缺口
 * @returns [位置得分, 理由描述]
 */
function calcPositionScore(
  candidatePosition: Position,
  gaps: Record<Position, number>
): [number, string | null] {
  const gap = gaps[candidatePosition]
  const totalGap = POSITION_LIST.reduce((sum, p) => sum + gaps[p], 0)

  if (gap > 0 && totalGap > 0) {
    const ratio = gap / totalGap
    const score = Math.round(POSITION_WEIGHT * (0.5 + 0.5 * ratio))
    const reason = `位置优先：正好填补${candidatePosition}缺口(缺${gap}人)`
    return [score, reason]
  } else if (gap > 0) {
    return [POSITION_WEIGHT, `位置优先：正好填补${candidatePosition}缺口(缺${gap}人)`]
  } else {
    const minScore = Math.round(POSITION_WEIGHT * 0.2)
    return [minScore, null]
  }
}

/**
 * 计算已报名队员的平均段位值
 * @param players 已报名用户列表
 * @returns 平均段位值，无报名时返回 null
 */
function getAverageLevelValue(players: User[]): number | null {
  if (players.length === 0) return null
  const sum = players.reduce((acc, u) => acc + LEVEL_ORDER[u.level], 0)
  return sum / players.length
}

/**
 * 计算段位得分（满分30）
 * 同段位：30分；相邻段位：15分；跨段（差>=2）：0分
 * @param candidateLevel 候选者段位
 * @param avgLevel 平均段位值
 * @returns [段位得分, 理由描述]
 */
function calcLevelScore(
  candidateLevel: Level,
  avgLevel: number | null
): [number, string] {
  if (avgLevel === null) {
    return [LEVEL_WEIGHT, '段位匹配：暂无已报名队员，段位匹配度默认满分']
  }

  const candidateValue = LEVEL_ORDER[candidateLevel]
  const diff = Math.abs(candidateValue - Math.round(avgLevel))

  if (diff === 0) {
    return [LEVEL_WEIGHT, `段位匹配：${candidateLevel}段位与现有队员水平契合`]
  } else if (diff === 1) {
    return [Math.round(LEVEL_WEIGHT / 2), `段位匹配：${candidateLevel}段位与现有队员水平接近`]
  } else {
    return [0, `段位匹配：${candidateLevel}段位与现有队员水平差距较大`]
  }
}

/**
 * 计算阵容均衡性得分（满分10）
 * 比较加入候选者前后位置人数的方差变化，方差越小越均衡
 * @param candidatePosition 候选者位置
 * @param currentCounts 当前各位置人数
 * @returns [均衡性得分, 理由描述]
 */
function calcBalanceScore(
  candidatePosition: Position,
  currentCounts: Record<Position, number>
): [number, string | null] {
  const values = POSITION_LIST.map((p) => currentCounts[p])
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const currentVariance =
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length

  const newCounts: Record<Position, number> = { ...currentCounts }
  newCounts[candidatePosition] += 1
  const newValues = POSITION_LIST.map((p) => newCounts[p])
  const newMean = newValues.reduce((a, b) => a + b, 0) / newValues.length
  const newVariance =
    newValues.reduce((a, b) => a + Math.pow(b - newMean, 2), 0) / newValues.length

  const improvement = currentVariance - newVariance

  if (improvement > 0.05) {
    return [BALANCE_WEIGHT, '均衡性：加入后阵容位置配置更加均衡']
  } else if (improvement >= -0.05) {
    return [Math.round(BALANCE_WEIGHT * 0.5), '均衡性：加入后阵容均衡性保持稳定']
  } else {
    return [0, null]
  }
}

/**
 * 智能推荐用户核心算法
 * 优先策略：位置缺口匹配 > 段位匹配 > 均衡性
 * 评分权重：位置60分 + 段位30分 + 均衡性10分 = 满分100
 * @param match 目标赛事对象
 * @param allUsers 全部用户列表
 * @param limit 最大返回数量，默认10
 * @returns 推荐结果数组，按得分降序排列；满员返回空数组
 */
export function recommendUsers(
  match: Match,
  allUsers: User[],
  limit: number = 10
): RecommendationResult[] {
  const maxPlayers = getMaxPlayers(match.mode)
  const enrolledCount = match.playerIds.length
  if (enrolledCount >= maxPlayers) {
    return []
  }

  const enrolledUsers = allUsers.filter((u) => match.playerIds.includes(u.id))
  const excludedIds = new Set<string>([match.creatorId, ...match.playerIds])
  const candidates = allUsers.filter((u) => !excludedIds.has(u.id))

  if (candidates.length === 0) {
    return []
  }

  const currentCounts = getCurrentPositionCounts(enrolledUsers)
  const gaps = getPositionGaps(match.mode, currentCounts)
  const avgLevel = getAverageLevelValue(enrolledUsers)

  const results: RecommendationResult[] = candidates.map((candidate) => {
    const reasons: string[] = []

    const [positionScore, positionReason] = calcPositionScore(candidate.position, gaps)
    if (positionReason) reasons.push(positionReason)

    const [levelScore, levelReason] = calcLevelScore(candidate.level, avgLevel)
    reasons.push(levelReason)

    const [balanceScore, balanceReason] = calcBalanceScore(candidate.position, currentCounts)
    if (balanceReason) reasons.push(balanceReason)

    const score = positionScore + levelScore + balanceScore

    return {
      user: candidate,
      score,
      reasons,
    }
  })

  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}
