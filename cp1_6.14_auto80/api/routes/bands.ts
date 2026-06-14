import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb, type DbBand, type DbUser, type BandMember } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const GRADIENTS = [
  'linear-gradient(135deg, #00D2FF, #8B5CF6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #00D2FF, #10B981)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #6366F1, #00D2FF)',
  'linear-gradient(135deg, #EC4899, #8B5CF6)',
  'linear-gradient(135deg, #14B8A6, #00D2FF)',
  'linear-gradient(135deg, #F97316, #F59E0B)',
]

router.use(authMiddleware)

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const db = await getDb()
    const bands = db.data.bands.filter((b: DbBand) =>
      b.members.some((m: BandMember) => m.userId === userId)
    )
    const bandsWithDetails = bands.map((band: DbBand) => {
      const memberDetails = band.members.map((m: BandMember) => {
        const user = db.data.users.find((u: DbUser) => u.id === m.userId)
        return {
          userId: m.userId,
          username: user?.username || 'Unknown',
          avatar: user?.avatar || '#666',
          role: m.role,
          joinedAt: m.joinedAt,
        }
      })
      return { ...band, memberDetails }
    })
    res.json({ success: true, data: bandsWithDetails })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取乐队列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const { name, description, inviteUserIds } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '乐队名称不能为空' })
      return
    }
    const db = await getDb()
    const now = new Date().toISOString()
    const gradientIndex = Math.floor(Math.random() * GRADIENTS.length)
    const members: BandMember[] = [
      { userId, role: 'admin', joinedAt: now },
    ]
    if (inviteUserIds && Array.isArray(inviteUserIds)) {
      for (const inviteId of inviteUserIds) {
        if (inviteId !== userId) {
          const userExists = db.data.users.find((u: DbUser) => u.id === inviteId)
          if (userExists) {
            members.push({ userId: inviteId, role: 'member', joinedAt: now })
          }
        }
      }
    }
    const band: DbBand = {
      id: uuidv4(),
      name,
      description: description || '',
      coverGradient: GRADIENTS[gradientIndex],
      members,
      createdAt: now,
      updatedAt: now,
    }
    db.data.bands.push(band)
    await db.write()
    res.status(201).json({ success: true, data: band })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建乐队失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const db = await getDb()
    const band = db.data.bands.find((b: DbBand) => b.id === req.params.id)
    if (!band) {
      res.status(404).json({ success: false, error: '乐队不存在' })
      return
    }
    if (!band.members.some((m: BandMember) => m.userId === userId)) {
      res.status(403).json({ success: false, error: '你不是该乐队成员' })
      return
    }
    const memberDetails = band.members.map((m: BandMember) => {
      const user = db.data.users.find((u: DbUser) => u.id === m.userId)
      return {
        userId: m.userId,
        username: user?.username || 'Unknown',
        avatar: user?.avatar || '#666',
        role: m.role,
        joinedAt: m.joinedAt,
      }
    })
    res.json({ success: true, data: { ...band, memberDetails } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取乐队信息失败' })
  }
})

router.post('/:id/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const { userId: inviteUserId } = req.body
    const db = await getDb()
    const band = db.data.bands.find((b: DbBand) => b.id === req.params.id)
    if (!band) {
      res.status(404).json({ success: false, error: '乐队不存在' })
      return
    }
    const isAdmin = band.members.some(
      (m: BandMember) => m.userId === userId && m.role === 'admin'
    )
    if (!isAdmin) {
      res.status(403).json({ success: false, error: '只有管理员可以邀请成员' })
      return
    }
    if (band.members.some((m: BandMember) => m.userId === inviteUserId)) {
      res.status(409).json({ success: false, error: '该用户已是乐队成员' })
      return
    }
    const inviteUser = db.data.users.find((u: DbUser) => u.id === inviteUserId)
    if (!inviteUser) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    band.members.push({
      userId: inviteUserId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    })
    band.updatedAt = new Date().toISOString()
    await db.write()
    res.json({ success: true, data: band })
  } catch (error) {
    res.status(500).json({ success: false, error: '邀请成员失败' })
  }
})

router.delete('/:id/members/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user.userId
    const targetUserId = req.params.userId
    const db = await getDb()
    const band = db.data.bands.find((b: DbBand) => b.id === req.params.id)
    if (!band) {
      res.status(404).json({ success: false, error: '乐队不存在' })
      return
    }
    const isAdmin = band.members.some(
      (m: BandMember) => m.userId === currentUserId && m.role === 'admin'
    )
    if (!isAdmin) {
      res.status(403).json({ success: false, error: '只有管理员可以移除成员' })
      return
    }
    band.members = band.members.filter((m: BandMember) => m.userId !== targetUserId)
    band.updatedAt = new Date().toISOString()
    await db.write()
    res.json({ success: true, data: band })
  } catch (error) {
    res.status(500).json({ success: false, error: '移除成员失败' })
  }
})

router.get('/search/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.query.username as string
    if (!username) {
      res.json({ success: true, data: [] })
      return
    }
    const db = await getDb()
    const users = db.data.users
      .filter((u: DbUser) => u.username.toLowerCase().includes(username.toLowerCase()))
      .slice(0, 10)
      .map((u: DbUser) => ({ id: u.id, username: u.username, avatar: u.avatar }))
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: '搜索用户失败' })
  }
})

export default router
