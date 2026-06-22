import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationsService'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const notifications = await getNotificationsByUser(userId, 20)
    res.json(notifications)
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ message: '获取通知失败' })
  }
})

router.get('/unread-count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const count = await getUnreadCount(userId)
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ message: '获取未读数量失败' })
  }
})

router.post('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const success = await markAsRead(req.params.id)
    if (!success) {
      return res.status(404).json({ message: '通知不存在' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ message: '标记已读失败' })
  }
})

router.post('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const count = await markAllAsRead(userId)
    res.json({ success: true, count })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ message: '标记全部已读失败' })
  }
})

export default router
