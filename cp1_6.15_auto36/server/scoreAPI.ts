import express, { type Request, type Response } from 'express'
import { scoreSpell } from './scoreService'
import { getTopTen, addScore } from './leaderboard'
import type {
  ScoreRequest,
  ScoreResponse,
  LeaderboardResponse,
  LeaderboardSubmitRequest,
  LeaderboardSubmitResponse,
} from '../shared/types'

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

    if (!element || !['fire', 'water', 'wind', 'thunder'].includes(element)) {
      res.status(400).json({
        score: 0,
        element: 'fire',
        matchQuality: 'fail',
        message: '元素类型无效',
      })
      return
    }

    const result = scoreSpell(trajectory, element)
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

      if (typeof score !== 'number' || score < 0 || score > 100) {
        res.status(400).json({
          success: false,
          rank: -1,
          isTopTen: false,
        })
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

      const { rank, isInTopTen } = addScore(nickname, score, element)
      res.status(200).json({
        success: true,
        rank,
        isTopTen: isInTopTen,
      })
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
