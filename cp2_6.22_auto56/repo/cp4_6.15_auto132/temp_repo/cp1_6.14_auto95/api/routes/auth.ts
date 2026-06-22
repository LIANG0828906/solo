import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { findReaderByEmail, createReader } from '../db/index.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: '请填写所有必填字段' })
    return
  }

  const existing = await findReaderByEmail(email)
  if (existing) {
    res.status(409).json({ success: false, message: '该邮箱已被注册' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const reader = await createReader({
    name,
    email,
    passwordHash,
    role: 'reader',
  })

  const token = generateToken({ id: reader.id, email: reader.email, role: reader.role })

  res.status(201).json({
    success: true,
    data: {
      token,
      reader: { id: reader.id, name: reader.name, email: reader.email, role: reader.role },
    },
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, message: '请输入邮箱和密码' })
    return
  }

  const reader = await findReaderByEmail(email)
  if (!reader) {
    res.status(401).json({ success: false, message: '邮箱或密码错误' })
    return
  }

  const valid = await bcrypt.compare(password, reader.passwordHash)
  if (!valid) {
    res.status(401).json({ success: false, message: '邮箱或密码错误' })
    return
  }

  const token = generateToken({ id: reader.id, email: reader.email, role: reader.role })

  res.json({
    success: true,
    data: {
      token,
      reader: { id: reader.id, name: reader.name, email: reader.email, role: reader.role },
    },
  })
})

export default router
