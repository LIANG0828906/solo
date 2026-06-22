import { Router, type Request, type Response } from 'express'
import { getShows, getShowById, createShow, deleteShow, updateShowStatus } from '../services/showService'
import { getRecordsByShowId, createRecord } from '../services/recordService'
import type { CreateShowRequest, UpdateShowStatusRequest, CreateRecordRequest } from '../types'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shows = await getShows()
    res.json({
      success: true,
      data: shows
    })
  } catch (error) {
    console.error('Get shows error:', error)
    res.status(500).json({
      success: false,
      error: '获取剧集列表失败'
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateShowRequest

    if (!body.tmdbId || !body.name) {
      res.status(400).json({
        success: false,
        error: '缺少必需字段: tmdbId, name'
      })
      return
    }

    const show = await createShow(body)
    res.status(201).json({
      success: true,
      data: show
    })
  } catch (error) {
    console.error('Create show error:', error)
    res.status(500).json({
      success: false,
      error: '添加剧集失败'
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const show = await getShowById(id)

    if (!show) {
      res.status(404).json({
        success: false,
        error: '剧集不存在'
      })
      return
    }

    res.json({
      success: true,
      data: show
    })
  } catch (error) {
    console.error('Get show error:', error)
    res.status(500).json({
      success: false,
      error: '获取剧集详情失败'
    })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const deleted = await deleteShow(id)

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '剧集不存在'
      })
      return
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete show error:', error)
    res.status(500).json({
      success: false,
      error: '删除剧集失败'
    })
  }
})

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body as UpdateShowStatusRequest

    if (!status || !['watching', 'completed', 'dropped'].includes(status)) {
      res.status(400).json({
        success: false,
        error: '无效的状态值，必须是: watching, completed, dropped'
      })
      return
    }

    const show = await updateShowStatus(id, status)

    if (!show) {
      res.status(404).json({
        success: false,
        error: '剧集不存在'
      })
      return
    }

    res.json({
      success: true,
      data: show
    })
  } catch (error) {
    console.error('Update show error:', error)
    res.status(500).json({
      success: false,
      error: '更新剧集状态失败'
    })
  }
})

router.get('/:id/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const records = await getRecordsByShowId(id)

    res.json({
      success: true,
      data: records
    })
  } catch (error) {
    console.error('Get records error:', error)
    res.status(500).json({
      success: false,
      error: '获取观看记录失败'
    })
  }
})

router.post('/:id/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const body = req.body as CreateRecordRequest

    if (body.season == null || body.episode == null) {
      res.status(400).json({
        success: false,
        error: '缺少必需字段: season, episode'
      })
      return
    }

    if (body.rating != null && (body.rating < 1 || body.rating > 5)) {
      res.status(400).json({
        success: false,
        error: '评分必须在 1-5 之间'
      })
      return
    }

    const record = await createRecord(id, body)

    if (!record) {
      res.status(404).json({
        success: false,
        error: '剧集不存在'
      })
      return
    }

    res.status(201).json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('Create record error:', error)
    res.status(500).json({
      success: false,
      error: '添加观看记录失败'
    })
  }
})

export default router
