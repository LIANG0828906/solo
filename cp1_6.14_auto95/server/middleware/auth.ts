import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthPayload } from '../types/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'library-management-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    return decoded
  } catch (error) {
    return null
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      })
      return
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        error: '认证令牌格式错误',
      })
      return
    }

    const payload = verifyToken(token)

    if (!payload) {
      res.status(401).json({
        success: false,
        error: '认证令牌无效或已过期',
      })
      return
    }

    req.user = payload
    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '认证过程中发生错误',
    })
  }
}

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '请先登录',
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: '需要管理员权限',
    })
    return
  }

  next()
}

export default authMiddleware
