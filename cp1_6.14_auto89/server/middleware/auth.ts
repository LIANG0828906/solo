// ============================================================
// JWT 认证中间件
// 数据流向：客户端 Authorization header → 验证 token → 挂载 userId 到 req.user
// 调用关系：server/routes/*.ts 中需要认证的路由使用此中间件
// 演示模式：当没有提供有效 token 时，默认使用第一个用户（demo_user）方便体验
// ============================================================

import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

/**
 * JWT 载荷接口
 */
export interface JwtPayload {
  userId: string;
}

/**
 * 扩展 Request 类型，添加 user 属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT 密钥
 * 生产环境应该使用环境变量
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT 认证中间件
 * 从 Authorization header 的 Bearer token 中解析 userId
 * 将 userId 挂载到 req.user 上
 *
 * 演示模式：如果没有有效 token，自动使用数据库中第一个用户作为默认用户
 * 这样无需登录即可体验全部功能
 *
 * @param req Express 请求对象
 * @param res Express 响应对象
 * @param next Express 下一个中间件函数
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 从 Authorization header 中获取 token
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // 解析 Bearer token
      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        try {
          // 验证 token
          const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
          req.user = decoded;
          next();
          return;
        } catch {
          // token 验证失败，继续使用演示模式
        }
      }
    }

    // ============================================
    // 演示模式：使用第一个用户作为默认用户
    // 数据流向：无 token → 读取 db → 取第一个用户 → 挂载到 req.user
    // ============================================
    await db.read();
    if (db.data.users.length > 0) {
      req.user = { userId: db.data.users[0].id };
      next();
      return;
    }

    // 没有用户数据的情况
    res.status(401).json({
      success: false,
      error: '请先注册用户',
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: '认证服务异常',
    });
  }
}

export default authMiddleware;
