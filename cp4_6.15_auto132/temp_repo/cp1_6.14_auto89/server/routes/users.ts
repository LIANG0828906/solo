// ============================================================
// 用户相关路由
// 数据流向：客户端请求 → 认证中间件（部分需要）→ 数据库操作 → 返回结果
// 调用关系：server/index.ts 中注册，依赖 server/middleware/auth.ts 和 server/db.ts
// ============================================================

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import authMiddleware from '../middleware/auth.js';
import type { PublicUser, User, Cloth, Outfit } from '../../src/types/index.js';
import type { Follow } from '../db.js';

const router = Router();

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
 * 模糊搜索用户（按 username）
 * GET /api/users/search
 * 
 * 不需要认证
 * 
 * 查询参数：
 * - q: 搜索关键词
 * 
 * 响应：
 * - success: 是否成功
 * - data: 用户数组
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const keyword = q.trim().toLowerCase();

    // 读取数据库
    await db.read();

    // 模糊搜索用户（按用户名）
    const users = db.data.users
      .filter(u => u.username.toLowerCase().includes(keyword))
      .slice(0, 20) // 最多返回 20 条结果
      .map(u => toPublicUser(u));

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: '搜索用户失败',
    });
  }
});

/**
 * 获取用户公开信息
 * GET /api/users/:id
 * 
 * 不需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: 用户公开信息 + 统计数据
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 读取数据库
    await db.read();

    // 查找用户
    const user = db.data.users.find(u => u.id === id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 统计数据
    const clothesCount = db.data.clothes.filter(c => c.userId === id).length;
    const outfitsCount = db.data.outfits.filter(o => o.userId === id).length;
    const followersCount = db.data.follows.filter(f => f.followingId === id).length;
    const followingCount = db.data.follows.filter(f => f.followerId === id).length;

    // 检查当前登录用户是否已关注此用户（如果已登录）
    let isFollowing = false;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // 简单处理：从 token 中提取用户信息
      try {
        const jwt = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          const decoded = jwt.default.verify(parts[1], JWT_SECRET) as { userId: string };
          isFollowing = db.data.follows.some(
            f => f.followerId === decoded.userId && f.followingId === id
          );
        }
      } catch {
        // 忽略 token 验证失败
      }
    }

    res.json({
      success: true,
      data: {
        ...toPublicUser(user),
        clothesCount,
        outfitsCount,
        followersCount,
        followingCount,
        isFollowing,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
});

/**
 * 关注用户
 * POST /api/users/:id/follow
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: { message }
 */
router.post('/:id/follow', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.user?.userId;
    const followingId = req.params.id;

    if (!followerId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 不能关注自己
    if (followerId === followingId) {
      res.status(400).json({
        success: false,
        error: '不能关注自己',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 检查被关注用户是否存在
    const followingUser = db.data.users.find(u => u.id === followingId);
    if (!followingUser) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 检查是否已关注
    const existingFollow = db.data.follows.find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    if (existingFollow) {
      res.status(400).json({
        success: false,
        error: '已经关注了该用户',
      });
      return;
    }

    // 创建关注关系
    const follow: Follow = {
      id: uuidv4(),
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    };

    db.data.follows.push(follow);
    await db.write();

    res.status(201).json({
      success: true,
      data: { message: '关注成功' },
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: '关注失败',
    });
  }
});

/**
 * 取消关注
 * DELETE /api/users/:id/follow
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: { message }
 */
router.delete('/:id/follow', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const followerId = req.user?.userId;
    const followingId = req.params.id;

    if (!followerId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 查找关注关系
    const followIndex = db.data.follows.findIndex(
      f => f.followerId === followerId && f.followingId === followingId
    );
    if (followIndex === -1) {
      res.status(400).json({
        success: false,
        error: '未关注该用户',
      });
      return;
    }

    // 删除关注关系
    db.data.follows.splice(followIndex, 1);
    await db.write();

    res.json({
      success: true,
      data: { message: '取消关注成功' },
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: '取消关注失败',
    });
  }
});

/**
 * 获取用户公开衣橱
 * GET /api/users/:id/clothes
 * 
 * 不需要认证
 * 
 * 查询参数：
 * - category: 可选，按分类筛选
 * 
 * 响应：
 * - success: 是否成功
 * - data: 衣物数组（按 order 排序）
 */
router.get('/:id/clothes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    // 读取数据库
    await db.read();

    // 检查用户是否存在
    const user = db.data.users.find(u => u.id === id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 过滤用户的衣物
    let clothes = db.data.clothes.filter(c => c.userId === id);

    // 按分类筛选
    if (category && typeof category === 'string') {
      clothes = clothes.filter(c => c.category === category);
    }

    // 按 order 排序
    clothes.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: clothes,
    });
  } catch (error) {
    console.error('Get user clothes error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户衣橱失败',
    });
  }
});

/**
 * 获取用户公开搭配
 * GET /api/users/:id/outfits
 * 
 * 不需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: 搭配数组（按创建时间倒序）
 */
router.get('/:id/outfits', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 读取数据库
    await db.read();

    // 检查用户是否存在
    const user = db.data.users.find(u => u.id === id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 过滤用户的搭配
    const outfits = db.data.outfits
      .filter(o => o.userId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: outfits,
    });
  } catch (error) {
    console.error('Get user outfits error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户搭配失败',
    });
  }
});

export default router;
