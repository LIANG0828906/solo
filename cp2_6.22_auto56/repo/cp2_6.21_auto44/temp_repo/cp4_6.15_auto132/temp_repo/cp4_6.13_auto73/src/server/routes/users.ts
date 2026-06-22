import { Router, type Response } from 'express'
import {
  getItemsByOwner,
  getTasksByPublisher,
  getTransactionsByUserId
} from '../db.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: req.user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    })
  }
})

router.get('/me/items', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const items = getItemsByOwner.all(userId)

    res.json({
      success: true,
      data: items
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户物品列表失败'
    })
  }
})

router.get('/me/tasks', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const tasks = getTasksByPublisher.all(userId)

    res.json({
      success: true,
      data: tasks
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户任务列表失败'
    })
  }
})

router.get('/me/transactions', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const transactions = getTransactionsByUserId.all(userId)

    res.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户交易记录失败'
    })
  }
})

export default router
