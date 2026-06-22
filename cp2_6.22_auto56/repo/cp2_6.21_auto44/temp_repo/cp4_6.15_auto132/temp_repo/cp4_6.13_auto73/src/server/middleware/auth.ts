import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getUserById, type DBUser } from '../db.js'

const JWT_SECRET = 'community-secret-key'

export interface AuthRequest extends Request {
  user?: Omit<DBUser, 'password'>
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      })
      return
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: '认证令牌格式错误'
      })
      return
    }

    const token = parts[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const user = getUserById.get(decoded.userId) as DBUser | undefined
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在'
      })
      return
    }

    const { password, ...userWithoutPassword } = user
    req.user = userWithoutPassword

    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期'
    })
  }
}

export default authMiddleware
