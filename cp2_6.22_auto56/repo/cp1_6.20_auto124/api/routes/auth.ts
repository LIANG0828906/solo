import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const JWT_SECRET = 'narrative-book-secret-2024'
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')

async function readUsers(): Promise<any[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeUsers(users: any[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' })
    return
  }

  const users = await readUsers()
  const existing = users.find((u: any) => u.email === email)
  if (existing) {
    res.status(409).json({ success: false, error: 'Email already registered' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  await writeUsers(users)

  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '7d' },
  )

  res.status(201).json({
    success: true,
    data: {
      user: { id: newUser.id, email: newUser.email },
      token,
    },
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' })
    return
  }

  const users = await readUsers()
  const user = users.find((u: any) => u.email === email)
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials' })
    return
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    res.status(401).json({ success: false, error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' },
  )

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email },
      token,
    },
  })
})

export default router
