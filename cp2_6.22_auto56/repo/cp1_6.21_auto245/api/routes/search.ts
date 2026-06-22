import { Router, type Request, type Response } from 'express'
import { searchShows } from '../services/searchService'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string' || q.trim() === '') {
      res.status(400).json({
        success: false,
        error: '查询参数 q 是必需的'
      })
      return
    }

    const results = await searchShows(q.trim())

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({
      success: false,
      error: '搜索失败'
    })
  }
})

export default router
