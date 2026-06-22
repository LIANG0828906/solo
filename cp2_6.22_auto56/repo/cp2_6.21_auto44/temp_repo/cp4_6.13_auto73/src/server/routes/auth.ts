import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import {
  getUserByUsername,
  insertUser,
  getUserById,
  type DBUser
} from '../db.js'

const router = Router()
const JWT_SECRET = 'community-secret-key'

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email } = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      })
      return
    }

    const existingUser = getUserByUsername.get(username) as DBUser | undefined
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: '用户名已存在'
      })
      return
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const userId = uuidv4()

    insertUser.run(userId, username, hashedPassword, email, 100, 100)

    const user = getUserById.get(userId) as DBUser | undefined
    if (!user) {
      res.status(500).json({
        success: false,
        error: '注册失败，请重试'
      })
      return
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    const { password: _, ...userWithoutPassword } = user

    res.status(201).json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      },
      message: '注册成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '注册失败，请重试'
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      })
      return
    }

    const user = getUserByUsername.get(username) as DBUser | undefined
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      })
      return
    }

    const isValidPassword = bcrypt.compareSync(password, user.password)
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      })
      return
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      },
      message: '登录成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败，请重试'
    })
  }
})

export default router
