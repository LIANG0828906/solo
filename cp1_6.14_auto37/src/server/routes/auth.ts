import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'time-capsule-secret-key'

interface RegisterBody {
  username: string
  password: string
}

interface LoginBody {
  username: string
  password: string
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body as RegisterBody

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: '用户名长度需在3-20个字符之间' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6位' })
    }

    await db.read()
    const existingUser = db.data!.users.find(u => u.username === username)
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    }

    db.data!.users.push(user)
    await db.write()

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: user.id, username: user.username },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body as LoginBody

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }

    await db.read()
    const user = db.data!.users.find(u => u.username === username)
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

export default router
export { JWT_SECRET }
