import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getDb, type DbUser } from '../db.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

const AVATAR_COLORS = [
  '#00D2FF', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6',
]

function generateAvatar(username: string): string {
  const index = username.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }
    if (username.length < 2 || username.length > 20) {
      res.status(400).json({ success: false, error: '用户名长度需在2-20之间' })
      return
    }
    if (password.length < 4) {
      res.status(400).json({ success: false, error: '密码长度不能少于4位' })
      return
    }
    const db = await getDb()
    const existing = db.data.users.find((u: DbUser) => u.username === username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user: DbUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      avatar: generateAvatar(username),
      createdAt: new Date().toISOString(),
    }
    db.data.users.push(user)
    await db.write()
    const token = generateToken({ userId: user.id, username: user.username })
    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, avatar: user.avatar },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }
    const db = await getDb()
    const user = db.data.users.find((u: DbUser) => u.username === username)
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const token = generateToken({ userId: user.id, username: user.username })
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, avatar: user.avatar },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

export default router
