import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../routes/auth'

export interface AuthRequest extends Request {
  userId?: string
  username?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ message: '未授权访问' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
    req.userId = decoded.userId
    req.username = decoded.username
    next()
  } catch (error) {
    return res.status(401).json({ message: '无效的token' })
  }
}
