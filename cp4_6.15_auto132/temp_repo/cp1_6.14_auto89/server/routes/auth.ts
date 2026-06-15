// ============================================================
// 认证路由
// 数据流向：客户端请求 → 验证/注册用户 → 返回 JWT token
// 调用关系：server/index.ts 中注册，server/middleware/auth.ts 验证 token
// ============================================================

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import type { User, PublicUser } from '../../src/types/index.js';

const router = Router();

/**
 * JWT 密钥
 * 生产环境应该使用环境变量
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT 过期时间
 */
const JWT_EXPIRES_IN = '7d';

/**
 * 生成 JWT token
 * 
 * @param userId 用户 ID
 * @returns JWT token 字符串
 */
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 将 User 转换为 PublicUser（移除密码等敏感信息）
 * 
 * @param user 用户对象
 * @returns 公开用户信息
 */
function toPublicUser(user: User): PublicUser {
  const { password, ...publicUser } = user;
  return publicUser;
}

/**
 * 用户注册
 * POST /api/auth/register
 * 
 * 请求体：
 * - username: 用户名
 * - password: 密码
 * 
 * 响应：
 * - success: 是否成功
 * - data: { user, token }
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        error: '用户名长度必须在 3-20 个字符之间',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: '密码长度不能少于 6 个字符',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 检查用户名是否已存在
    const existingUser = db.data.users.find(u => u.username === username);
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: '用户名已被注册',
      });
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser: User = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      avatar: '',
      bio: '',
      createdAt: new Date().toISOString(),
    };

    // 保存到数据库
    db.data.users.push(newUser);
    await db.write();

    // 生成 token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(newUser),
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 * 
 * 请求体：
 * - username: 用户名
 * - password: 密码
 * 
 * 响应：
 * - success: 是否成功
 * - data: { user, token }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 查找用户
    const user = db.data.users.find(u => u.username === username);
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: user
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    // 从 header 中获取 token（手动验证，不使用中间件以保持路由简洁）
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: '认证令牌格式错误',
      });
      return;
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // 读取数据库
    await db.read();

    // 查找用户
    const user = db.data.users.find(u => u.id === decoded.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: toPublicUser(user),
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    });
  }
});

export default router;
