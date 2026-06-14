import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db, getTodayKey } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

interface CreateCapsuleBody {
  type: 'text' | 'image'
  content: string
  openDate: string
}

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 12

    await db.read()
    
    const userCapsules = db.data!.capsules
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const receivedDrifts = db.data!.drifts
      .filter(d => d.toUserId === userId)
      .map(d => d.capsuleId)

    const receivedCapsules = db.data!.capsules
      .filter(c => receivedDrifts.includes(c.id))
      .sort((a, b) => {
        const driftA = db.data!.drifts.find(d => d.capsuleId === a.id && d.toUserId === userId)
        const driftB = db.data!.drifts.find(d => d.capsuleId === b.id && d.toUserId === userId)
        return new Date(driftB!.createdAt).getTime() - new Date(driftA!.createdAt).getTime()
      })

    const allCapsules = [...userCapsules, ...receivedCapsules]
    const total = allCapsules.length
    const start = (page - 1) * pageSize
    const paginated = allCapsules.slice(start, start + pageSize)

    const capsulesWithMeta = paginated.map(capsule => {
      const isOwner = capsule.userId === userId
      const now = new Date()
      const openDate = new Date(capsule.openDate)
      const isOpenable = now >= openDate

      const drift = db.data!.drifts.find(d => d.capsuleId === capsule.id && d.toUserId === userId)
      
      return {
        ...capsule,
        isOwner,
        isOpenable,
        driftId: drift?.id,
        reply: drift?.reply,
        replyAt: drift?.replyAt,
        replyVisibleAt: drift?.replyVisibleAt,
        canViewReply: drift?.replyVisibleAt ? new Date() >= new Date(drift.replyVisibleAt) : false,
      }
    })

    res.json({
      capsules: capsulesWithMeta,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    })
  } catch (error) {
    console.error('Get capsules error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { type, content, openDate } = req.body as CreateCapsuleBody

    if (!type || !['text', 'image'].includes(type)) {
      return res.status(400).json({ message: '无效的胶囊类型' })
    }

    if (type === 'text' && (!content || content.length > 500)) {
      return res.status(400).json({ message: '文字内容需在1-500字之间' })
    }

    if (!openDate) {
      return res.status(400).json({ message: '请设置开封日期' })
    }

    const openDateTime = new Date(openDate)
    const minOpenDate = new Date()
    minOpenDate.setHours(minOpenDate.getHours() + 24)

    if (openDateTime < minOpenDate) {
      return res.status(400).json({ message: '开封日期至少需要在24小时后' })
    }

    await db.read()

    const capsule = {
      id: uuidv4(),
      userId,
      type,
      content: type === 'text' ? content : '',
      imageUrl: type === 'image' ? content : undefined,
      openDate: openDateTime.toISOString(),
      createdAt: new Date().toISOString(),
      isOpened: false,
      isDrifted: false,
      drifts: [],
    }

    db.data!.capsules.push(capsule)
    await db.write()

    res.status(201).json({
      message: '胶囊创建成功',
      capsule,
    })
  } catch (error) {
    console.error('Create capsule error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:id/open', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params

    await db.read()
    const capsule = db.data!.capsules.find(c => c.id === id)

    if (!capsule) {
      return res.status(404).json({ message: '胶囊不存在' })
    }

    const isOwner = capsule.userId === userId
    const isRecipient = db.data!.drifts.some(d => d.capsuleId === id && d.toUserId === userId)

    if (!isOwner && !isRecipient) {
      return res.status(403).json({ message: '无权查看此胶囊' })
    }

    const now = new Date()
    const openDate = new Date(capsule.openDate)

    if (now < openDate) {
      return res.status(400).json({ message: '还未到开封时间' })
    }

    if (!capsule.isOpened) {
      capsule.isOpened = true
      capsule.openedAt = now.toISOString()

      const todayKey = getTodayKey()
      let todayStat = db.data!.dailyStats.find(s => s.date === todayKey)
      if (!todayStat) {
        todayStat = { date: todayKey, openedCount: 0, driftedCount: 0 }
        db.data!.dailyStats.push(todayStat)
      }
      todayStat.openedCount++

      await db.write()
    }

    res.json({
      message: '胶囊已开封',
      capsule,
    })
  } catch (error) {
    console.error('Open capsule error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:id/drift', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params

    await db.read()
    const capsule = db.data!.capsules.find(c => c.id === id)

    if (!capsule) {
      return res.status(404).json({ message: '胶囊不存在' })
    }

    if (capsule.userId !== userId) {
      return res.status(403).json({ message: '只能漂流自己的胶囊' })
    }

    if (!capsule.isOpened) {
      return res.status(400).json({ message: '只能漂流已开封的胶囊' })
    }

    if (capsule.isDrifted) {
      return res.status(400).json({ message: '该胶囊已经漂流过了' })
    }

    const todayKey = getTodayKey()
    const todayDrifted = db.data!.capsules.filter(
      c => c.userId === userId && c.driftedAt && new Date(c.driftedAt).toDateString() === new Date().toDateString()
    ).length

    if (todayDrifted >= 1) {
      return res.status(400).json({ message: '每天只能扔出一个漂流瓶' })
    }

    const allUsers = db.data!.users.filter(u => u.id !== userId)
    if (allUsers.length === 0) {
      return res.status(400).json({ message: '暂时没有其他用户可以接收漂流瓶' })
    }

    const eligibleUsers = allUsers.filter(u => {
      const todayReceived = db.data!.drifts.filter(
        d => d.toUserId === u.id && new Date(d.createdAt).toDateString() === new Date().toDateString()
      ).length
      return todayReceived < 3
    })

    if (eligibleUsers.length === 0) {
      return res.status(400).json({ message: '今日漂流瓶已全部送出，请明天再试' })
    }

    const randomUser = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)]

    const drift = {
      id: uuidv4(),
      capsuleId: id,
      fromUserId: userId,
      toUserId: randomUser.id,
      createdAt: new Date().toISOString(),
    }

    db.data!.drifts.push(drift)

    capsule.isDrifted = true
    capsule.driftedAt = new Date().toISOString()
    capsule.drifts.push(drift.id)

    let todayStat = db.data!.dailyStats.find(s => s.date === todayKey)
    if (!todayStat) {
      todayStat = { date: todayKey, openedCount: 0, driftedCount: 0 }
      db.data!.dailyStats.push(todayStat)
    }
    todayStat.driftedCount++

    await db.write()

    res.json({
      message: '漂流瓶已送出',
      drift,
    })
  } catch (error) {
    console.error('Drift capsule error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    await db.read()

    const totalCapsules = db.data!.capsules.length
    const openedCapsules = db.data!.capsules.filter(c => c.isOpened).length
    const unopenedCapsules = totalCapsules - openedCapsules

    const todayKey = getTodayKey()
    const todayStat = db.data!.dailyStats.find(s => s.date === todayKey)

    res.json({
      totalCapsules,
      unopenedCapsules,
      openedCapsules,
      todayOpened: todayStat?.openedCount || 0,
      todayDrifted: todayStat?.driftedCount || 0,
      openRate: totalCapsules > 0 ? openedCapsules / totalCapsules : 0,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

export default router
