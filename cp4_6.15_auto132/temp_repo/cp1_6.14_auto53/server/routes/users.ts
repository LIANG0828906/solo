import { Router } from 'express'
import {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  getPublicUser,
} from '../services/usersService'
import { signToken, authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

const CITIES = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '成都',
  '武汉',
  '西安',
  '南京',
  '重庆',
  '苏州',
  '天津',
]

const validatePassword = (password: string): boolean => {
  if (password.length < 6) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  return hasLetter && hasDigit
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname, city } = req.body

    if (!email || !password || !nickname || !city) {
      return res.status(400).json({ message: '请填写所有必填项' })
    }

    if (!CITIES.includes(city)) {
      return res.status(400).json({ message: '请选择有效的城市' })
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: '密码至少6位，需包含字母和数字' })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' })
    }

    const user = await createUser({ email, password, nickname, city })
    const token = signToken(user.id)
    const publicUser = getPublicUser(user)

    res.status(201).json({
      user: publicUser,
      token,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: '注册失败' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: '请输入邮箱和密码' })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const isValid = await verifyPassword(user, password)
    if (!isValid) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const token = signToken(user.id)
    const publicUser = getPublicUser(user)

    res.json({
      user: publicUser,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.userId!)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    res.json(getPublicUser(user))
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ message: '获取用户信息失败' })
  }
})

router.get('/cities', (_req, res) => {
  res.json(CITIES)
})

router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    res.json(getPublicUser(user))
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: '获取用户信息失败' })
  }
})

export default router
