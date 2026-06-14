import { Router, type Request, type Response } from 'express'
import db from '../db/lowdb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const data = db.data!

    const weekDates: string[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      weekDates.push(date.toISOString().split('T')[0])
    }

    const monthDates: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      monthDates.push(date.toISOString().split('T')[0])
    }

    res.status(200).json({
      success: true,
      data: {
        user: data.user,
        weekPoints: {
          dates: weekDates,
          points: data.weekPoints,
        },
        monthPoints: {
          dates: monthDates,
          points: data.monthPoints,
        },
        history: data.history,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取积分数据失败',
    })
  }
})

export default router
