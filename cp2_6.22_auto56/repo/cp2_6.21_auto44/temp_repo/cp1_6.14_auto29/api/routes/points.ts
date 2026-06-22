// 调用关系：被 app.ts 引用，引用 db/lowdb.ts
// 处理积分数据相关的 GET 请求：用户信息、周/月积分统计、兑换历史

import { Router, type Request, type Response } from 'express'
import db from '../db/lowdb.js'

const router = Router()

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const getMondayOfWeek = (date: Date): Date => {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1)
  result.setDate(diff)
  result.setHours(0, 0, 0, 0)
  return result
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    try {
      await db.read()
    } catch {
      throw new Error('数据库读取失败')
    }

    const data = db.data
    if (!data) {
      throw new Error('数据库未初始化')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekDates: string[] = []
    const monday = getMondayOfWeek(today)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(formatDate(date))
    }

    const monthDates: string[] = []
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date <= today) {
        monthDates.push(formatDate(date))
      }
    }

    const sortedHistory = [...data.history].sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    const monthPointsLength = Math.min(data.monthPoints.length, monthDates.length)
    const truncatedMonthPoints = data.monthPoints.slice(0, monthPointsLength)

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
          points: truncatedMonthPoints,
        },
        history: sortedHistory,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '获取积分数据失败'
    res.status(500).json({
      success: false,
      message: errorMessage,
    })
  }
})

export default router
