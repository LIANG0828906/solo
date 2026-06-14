import { Router, type Request, type Response } from 'express'
import db from '../db/lowdb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const data = db.data!

    res.status(200).json({
      success: true,
      data: data.products,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
    })
  }
})

export default router
