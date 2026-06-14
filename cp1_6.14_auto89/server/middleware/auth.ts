// ============================================================
// JWT 认证中间件
// 数据流向：客户端 Authorization header → 验证 token → 挂载 userId 到 req.user
// 调用关系：server/routes/*.ts 中需要认证的路由使用此中间件
// ============================================================

import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 * @param req Express 请求对象
 * @param res Express 响应对象
 * @param next Express 下一个中间件函数
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    // 从 Authorization header 中获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      });
      return;
    }

    // 解析 Bearer token
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: '认证令牌格式错误',
      });
      return;
    }

    const token = parts[1];

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 将 userId 挂载到 req.user 上
    req.user = decoded;

    // 继续下一个中间件/路由处理
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    });
  }
}

export default authMiddleware;
