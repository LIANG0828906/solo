import express, { type Request, type Response } from 'express'
import { scoreSpell } from './scoreService'
import { getTopTen, addScore } from './leaderboard'
import type {
  ScoreRequest,
  ScoreResponse,
  LeaderboardResponse,
  LeaderboardSubmitRequest,
  LeaderboardSubmitResponse,
  Point,
  ElementType,
} from '../shared/types'

interface CacheEntry {
  result: ScoreResponse
  timestamp: number
}

const CACHE_TTL = 30 * 1000
const CACHE_MAX_SIZE = 100
const scoreCache = new Map<string, CacheEntry>()

let isLeaderboardWriting = false
const leaderboardQueue: Array<() => void> = []

function generateCacheKey(trajectory: Point[], element: ElementType): string {
  const pointsStr = trajectory.map((p) => `${p.x},${p.y},${p.timestamp}`).join(';')
  const hash = pointsStr.slice(0, 16)
  return `${element}:${trajectory.length}:${hash}`
}

function getCache(key: string): ScoreResponse | null {
  const entry = scoreCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    scoreCache.delete(key)
    return null
  }
  return entry.result
}

function setCache(key: string, result: ScoreResponse): void {
  if (scoreCache.size >= CACHE_MAX_SIZE) {
    const firstKey = scoreCache.keys().next().value
    if (firstKey !== undefined) {
      scoreCache.delete(firstKey)
    }
  }
  scoreCache.set(key, {
    result,
    timestamp: Date.now(),
  })
}

function validatePoint(point: unknown): point is Point {
  if (typeof point !== 'object' || point === null) return false
  const p = point as Record<string, unknown>
  return (
    typeof p.x === 'number' &&
    typeof p.y === 'number' &&
    typeof p.timestamp === 'number'
  )
}

const router = express.Router()

router.post('/score', (req: Request<unknown, unknown, ScoreRequest>, res: Response<ScoreResponse>): void => {
  try {
    const { trajectory, element } = req.body

    if (!trajectory || !Array.isArray(trajectory)) {
      res.status(400).json({
        score: 0,
        element: element || 'fire',
        matchQuality: 'fail',
        message: '轨迹数据无效',
      })
      return
    }

    if (trajectory.length === 0) {
      res.status(400).json({
        score: 0,
        element: element || 'fire',
        matchQuality: 'fail',
        message: '轨迹不能为空',
      })
      return
    }

    if (trajectory.length < 3) {
      res.status(400).json({
        score: 0,
        element: element || 'fire',
        matchQuality: 'fail',
        message: '轨迹点数不足',
      })
      return
    }

    for (let i = 0; i < trajectory.length; i++) {
      if (!validatePoint(trajectory[i])) {
        res.status(400).json({
          score: 0,
          element: element || 'fire',
          matchQuality: 'fail',
          message: '轨迹点数据无效',
        })
        return
      }
    }

    if (!element || !['fire', 'water', 'wind', 'thunder'].includes(element)) {
      res.status(400).json({
        score: 0,
        element: 'fire',
        matchQuality: 'fail',
        message: '元素类型无效',
      })
      return
    }

    const cacheKey = generateCacheKey(trajectory, element)
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      res.status(200).json(cachedResult)
      return
    }

    const result = scoreSpell(trajectory, element)
    setCache(cacheKey, result)
    res.status(200).json(result)
  } catch (error) {
    console.error('Score calculation error:', error)
    res.status(500).json({
      score: 0,
      element: req.body.element || 'fire',
      matchQuality: 'fail',
      message: '评分服务内部错误',
    })
  }
})

router.get('/leaderboard', (_req: Request, res: Response<LeaderboardResponse>): void => {
  try {
    const rankings = getTopTen()
    res.status(200).json({ rankings })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    res.status(500).json({ rankings: [] })
  }
})

function processLeaderboardQueue(): void {
  if (leaderboardQueue.length === 0 || isLeaderboardWriting) return
  isLeaderboardWriting = true
  const next = leaderboardQueue.shift()
  if (next) {
    next()
  }
}

router.post(
  '/leaderboard',
  (req: Request<unknown, unknown, LeaderboardSubmitRequest>, res: Response<LeaderboardSubmitResponse>): void => {
    try {
      const { nickname, score, element } = req.body

      if (!nickname || typeof nickname !== 'string') {
        res.status(400).json({
          success: false,
          rank: -1,
          isTopTen: false,
        })
        return
      }

      if (nickname.length < 1 || nickname.length > 20) {
        res.status(400).json({
          success: false,
          rank: -1,
          isTopTen: false,
        })
        res.statusMessage = '昵称长度需在1-20之间'
        return
      }

      if (typeof score !== 'number') {
        res.status(400).json({
          success: false,
          rank: -1,
          isTopTen: false,
        })
        res.statusMessage = '分数必须在0-100之间'
        return
      }

      if (score < 0 || score > 100) {
        res.status(400).json({
          success: false,
          rank: -1,
          isTopTen: false,
        })
        res.statusMessage = '分数必须在0-100之间'
        return
      }

      if (!element || !['fire', 'water', 'wind', 'thunder'].includes(element)) {
        res.status(400).json({
          success: false,
          rank: -1,
          isTopTen: false,
        })
        return
      }

      const task = () => {
        Promise.resolve().then(() => {
          try {
            const { rank, isInTopTen } = addScore(nickname, score, element)
            res.status(200).json({
              success: true,
              rank,
              isTopTen: isInTopTen,
            })
          } catch (innerError) {
            console.error('Leaderboard submit error:', innerError)
            res.status(500).json({
              success: false,
              rank: -1,
              isTopTen: false,
            })
          } finally {
            isLeaderboardWriting = false
            processLeaderboardQueue()
          }
        })
      }

      leaderboardQueue.push(task)
      processLeaderboardQueue()
    } catch (error) {
      console.error('Leaderboard submit error:', error)
      res.status(500).json({
        success: false,
        rank: -1,
        isTopTen: false,
      })
    }
  },
)

export default router
