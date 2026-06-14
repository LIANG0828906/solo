import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'library-secret-key'

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({
      success: false,
      message: '未提供访问令牌',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: '访问令牌已过期',
      })
      return
    }
    res.status(403).json({
      success: false,
      message: '无效的访问令牌',
    })
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: '未登录',
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: '需要管理员权限',
    })
    return
  }

  next()
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
