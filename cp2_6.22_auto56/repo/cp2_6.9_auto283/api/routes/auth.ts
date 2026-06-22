import { Router, type Request, type Response } from 'express'
import { createHash } from 'crypto'
import mongoose from 'mongoose'
import UserModel from '../models/User.js'
import { generateToken, invalidateToken, authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex')
}

interface InMemoryUser {
  _id: string
  username: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

const inMemoryUsers: InMemoryUser[] = []

const createUser = async (username: string, email: string, passwordHash: string) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = new UserModel({ username, email, passwordHash })
      await user.save()
      return user
    } catch (error) {
      console.log('MongoDB save failed, using in-memory storage')
    }
  }

  const existingUser = inMemoryUsers.find(
    (u) => u.username === username || u.email === email
  )
  if (existingUser) {
    throw new Error('Username or email already exists')
  }

  const newUser: InMemoryUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    username,
    email,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  inMemoryUsers.push(newUser)
  return newUser
}

const findUser = async (identifier: string) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await UserModel.findOne({
        $or: [{ username: identifier }, { email: identifier }],
      })
      if (user) return user
    } catch (error) {
      console.log('MongoDB query failed, using in-memory storage')
    }
  }

  return inMemoryUsers.find(
    (u) => u.username === identifier || u.email === identifier
  )
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Username, email, and password are required',
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      })
      return
    }

    const passwordHash = hashPassword(password)

    const user = await createUser(username, email, passwordHash)

    const token = generateToken(user._id.toString(), user.username, user.email)

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        error: 'Identifier and password are required',
      })
      return
    }

    const user = await findUser(identifier)

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
      return
    }

    const passwordHash = hashPassword(password)

    if (passwordHash !== user.passwordHash) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
      return
    }

    const token = generateToken(user._id.toString(), user.username, user.email)

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
    })
  }
})

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader) {
      const token = authHeader.split(' ')[1]
      invalidateToken(token)
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    })
  }
})

export default router
