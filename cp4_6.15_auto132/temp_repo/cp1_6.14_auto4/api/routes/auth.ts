/**
 * 【文件职责】用户认证路由模块，处理注册、登录、会话获取、登出等认证相关接口
 * 【被调用方】api/app.ts（以 /api/auth 路径挂载本路由）
 * 【数据流向】前端请求 → 校验入参 → 查询/写入 db.data.users → 写入 session → 返回脱敏用户信息
 */

import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import type { User, Position, Level } from '../../shared/types.js'
import { POSITION_LIST, LEVEL_LIST } from '../../shared/types.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

/** 脱敏用户（移除密码字段） */
type SafeUser = Omit<User, 'password'>

/**
 * 将 User 转换为脱敏 SafeUser
 * @param user 原始用户对象
 * @returns 不含密码的用户信息
 */
function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safe } = user
  return safe
}

/**
 * POST /api/auth/register - 用户注册
 * @body nickname, position, level, password
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname, position, level, password } = req.body

    if (!nickname || !position || !level || !password) {
      res.status(400).json({ error: '缺少必填字段' })
      return
    }

    if (!POSITION_LIST.includes(position as Position)) {
      res.status(400).json({ error: '无效的位置字段' })
      return
    }
    if (!LEVEL_LIST.includes(level as Level)) {
      res.status(400).json({ error: '无效的段位字段' })
      return
    }

    const db = await getDb()
    const existing = db.data.users.find((u) => u.nickname === nickname)
    if (existing) {
      res.status(400).json({ error: '昵称已被占用' })
      return
    }

    const newUser: User = {
      id: uuidv4(),
      nickname,
      position: position as Position,
      level: level as Level,
      password,
    }

    db.data.users.push(newUser)
    await db.write()

    req.session.userId = newUser.id
    res.status(201).json(toSafeUser(newUser))
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * POST /api/auth/login - 用户登录
 * @body nickname, password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname, password } = req.body

    if (!nickname || !password) {
      res.status(400).json({ error: '缺少必填字段' })
      return
    }

    const db = await getDb()
    const user = db.data.users.find((u) => u.nickname === nickname)

    if (!user || user.password !== password) {
      res.status(401).json({ error: '昵称或密码错误' })
      return
    }

    req.session.userId = user.id
    res.status(200).json(toSafeUser(user))
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * GET /api/auth/session - 获取当前登录会话
 */
router.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session.userId) {
      res.status(200).json(null)
      return
    }

    const db = await getDb()
    const user = db.data.users.find((u) => u.id === req.session.userId)

    if (!user) {
      req.session.destroy(() => {})
      res.status(200).json(null)
      return
    }

    res.status(200).json(toSafeUser(user))
  } catch (error) {
    console.error('Session error:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * POST /api/auth/logout - 登出并销毁会话
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err)
        res.status(500).json({ error: '登出失败' })
        return
      }
      res