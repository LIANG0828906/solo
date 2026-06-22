import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    username: string
    email: string
  }
}

interface TokenStore {
  [token: string]: {
    userId: string
    username: string
    email: string
    expiresAt: number
  }
}

const tokenStore: TokenStore = {}
const TOKEN_EXPIRE_MS = 24 * 60 * 60 * 1000

export const generateToken = (userId: string, username: string, email: string): string => {
  const token = uuidv4()
  tokenStore[token] = {
    userId,
    username,
    email,
    expiresAt: Date.now() + TOKEN_EXPIRE_MS,
  }
  return token
}

export const invalidateToken = (token: string): void => {
  delete tokenStore[token]
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
    })
    return
  }

  const token = authHeader.split(' ')[1]
  const tokenData = tokenStore[token]

  if (!tokenData) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    })
    return
  }

  if (Date.now() > tokenData.expiresAt) {
    delete tokenStore[token]
    res.status(401).json({
      success: false,
      error: 'Token expired',
    })
    return
  }

  req.userId = tokenData.userId
  req.user = {
    id: tokenData.userId,
    username: tokenData.username,
    email: tokenData.email,
  }

  next()
}
