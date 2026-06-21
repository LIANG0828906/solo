import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getUserByUsername, createUser, getUserById } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'recipe-platform-secret-key-2024'
const TOKEN_EXPIRES_IN = '7d'

export interface AuthRequest extends Request {
  userId?: number
  user?: { id: number; username: string; avatar?: string }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    const user = getUserById(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }

    req.userId = decoded.userId
    req.user = user
    next()
  } catch (err) {
    return res.status(403).json({ error: '无效的访问令牌' })
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度需在2-20个字符之间' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' })
    }

    const existingUser = getUserByUsername(username)
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`

    const userId = createUser(username, hashedPassword, avatar)
    const user = getUserById(userId)

    if (!user) {
      return res.status(500).json({ error: '创建用户失败' })
    }

    const token = generateToken(userId)

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    console.error('注册错误:', err)
    return res.status(500).json({ error: '注册失败，请稍后重试' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const user = getUserByUsername(username)
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = generateToken(user.id)

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    console.error('登录错误:', err)
    return res.status(500).json({ error: '登录失败，请稍后重试' })
  }
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' })
  }

  return res.json({
    user: req.user,
  })
}
