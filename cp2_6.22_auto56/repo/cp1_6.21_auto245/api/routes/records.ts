import { Router, type Request, type Response } from 'express'
import { deleteRecord } from '../services/recordService'

const router = Router()

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const deleted = await deleteRecord(id)

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '观看记录不存在'
      })
      return
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete record error:', error)
    res.status(500).json({
      success: false,
      error: '删除观看记录失败'
    })
  }
})

export default router
