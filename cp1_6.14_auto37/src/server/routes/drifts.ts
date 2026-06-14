import { Router } from 'express'
import { db } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 12

    await db.read()

    const drifts = db.data!.drifts
      .filter(d => d.toUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = drifts.length
    const start = (page - 1) * pageSize
    const paginated = drifts.slice(start, start + pageSize)

    const driftsWithCapsule = paginated.map(drift => {
      const capsule = db.data!.capsules.find(c => c.id === drift.capsuleId)
      const now = new Date()
      const openDate = new Date(capsule!.openDate)
      const isOpenable = now >= openDate

      return {
        drift,
        capsule: {
          ...capsule,
          isOpenable,
        },
        canViewReply: drift.replyVisibleAt ? new Date() >= new Date(drift.replyVisibleAt) : false,
      }
    })

    res.json({
      drifts: driftsWithCapsule,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    })
  } catch (error) {
    console.error('Get drifts error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:id/reply', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { reply } = req.body as { reply: string }

    if (!reply || reply.length > 200) {
      return res.status(400).json({ message: '回复内容需在1-200字之间' })
    }

    await db.read()
    const drift = db.data!.drifts.find(d => d.id === id)

    if (!drift) {
      return res.status(404).json({ message: '漂流瓶不存在' })
    }

    if (drift.toUserId !== userId) {
      return res.status(403).json({ message: '只能回复收到的漂流瓶' })
    }

    if (drift.reply) {
      return res.status(400).json({ message: '已经回复过了' })
    }

    const replyVisibleAt = new Date()
    replyVisibleAt.setHours(replyVisibleAt.getHours() + 24)

    drift.reply = reply
    drift.replyAt = new Date().toISOString()
    drift.replyVisibleAt = replyVisibleAt.toISOString()

    await db.write()

    res.json({
      message: '回复成功',
      drift,
    })
  } catch (error) {
    console.error('Reply drift error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/sent', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!

    await db.read()

    const sentDrifts = db.data!.drifts
      .filter(d => d.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const driftsWithCapsule = sentDrifts.map(drift => {
      const capsule = db.data!.capsules.find(c => c.id === drift.capsuleId)
      return {
        drift,
        capsule,
        canViewReply: drift.replyVisibleAt ? new Date() >= new Date(drift.replyVisibleAt) : false,
      }
    })

    res.json({ drifts: driftsWithCapsule })
  } catch (error) {
    console.error('Get sent drifts error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

export default router
