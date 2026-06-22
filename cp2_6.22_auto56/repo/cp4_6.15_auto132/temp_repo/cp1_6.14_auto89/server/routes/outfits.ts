// ============================================================
// 搭配路由
// 数据流向：客户端请求 → 认证中间件 → 数据库操作 → 返回结果
// 调用关系：server/index.ts 中注册，依赖 server/middleware/auth.ts、server/db.ts、server/utils/styleGenerator.ts
// ============================================================

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import authMiddleware from '../middleware/auth.js';
import { generateStyleTags } from '../utils/styleGenerator.js';
import type { Outfit, Cloth } from '../../src/types/index.js';

const router = Router();

/**
 * 获取当前用户所有搭配
 * GET /api/outfits
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: 搭配数组（按创建时间倒序）
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 过滤当前用户的搭配
    const outfits = db.data.outfits
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: outfits,
    });
  } catch (error) {
    console.error('Get outfits error:', error);
    res.status(500).json({
      success: false,
      error: '获取搭配列表失败',
    });
  }
});

/**
 * 创建新搭配
 * POST /api/outfits
 * 
 * 需要认证
 * 
 * 请求体：
 * - name: 搭配名称
 * - description: 搭配描述
 * - topId: 上装衣物 ID（可选）
 * - bottomId: 下装衣物 ID（可选）
 * - shoesId: 鞋履衣物 ID（可选）
 * - accessoryId: 配饰衣物 ID（可选）
 * 
 * 响应：
 * - success: 是否成功
 * - data: 新创建的搭配对象
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    const { name, description, topId, bottomId, shoesId, accessoryId } = req.body;

    // 参数验证
    if (!name) {
      res.status(400).json({
        success: false,
        error: '搭配名称不能为空',
      });
      return;
    }

    // 至少选择一件衣物
    if (!topId && !bottomId && !shoesId && !accessoryId) {
      res.status(400).json({
        success: false,
        error: '请至少选择一件衣物',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 收集选中的衣物 ID
    const clothIds: string[] = [];
    if (topId) clothIds.push(topId);
    if (bottomId) clothIds.push(bottomId);
    if (shoesId) clothIds.push(shoesId);
    if (accessoryId) clothIds.push(accessoryId);

    // 验证所有衣物都存在且属于当前用户
    const clothes: Cloth[] = [];
    for (const clothId of clothIds) {
      const cloth = db.data.clothes.find(c => c.id === clothId);
      if (!cloth) {
        res.status(404).json({
          success: false,
          error: `衣物 ${clothId} 不存在`,
        });
        return;
      }
      if (cloth.userId !== userId) {
        res.status(403).json({
          success: false,
          error: '无权限使用此衣物',
        });
        return;
      }
      clothes.push(cloth);
    }

    // 调用 styleGenerator 自动计算 styleTags
    const styleTags = generateStyleTags(clothes);

    // 创建新搭配
    const newOutfit: Outfit = {
      id: uuidv4(),
      userId,
      name,
      description: description || '',
      topId: topId || undefined,
      bottomId: bottomId || undefined,
      shoesId: shoesId || undefined,
      accessoryId: accessoryId || undefined,
      styleTags,
      createdAt: new Date().toISOString(),
    };

    // 保存到数据库
    db.data.outfits.push(newOutfit);
    await db.write();

    res.status(201).json({
      success: true,
      data: newOutfit,
    });
  } catch (error) {
    console.error('Create outfit error:', error);
    res.status(500).json({
      success: false,
      error: '创建搭配失败',
    });
  }
});

/**
 * 获取单个搭配详情
 * GET /api/outfits/:id
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: 搭配对象（包含衣物详情）
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 查找搭配
    const outfit = db.data.outfits.find(o => o.id === id);
    if (!outfit) {
      res.status(404).json({
        success: false,
        error: '搭配不存在',
      });
      return;
    }

    // 验证权限（只能查看自己的搭配）
    if (outfit.userId !== userId) {
      res.status(403).json({
        success: false,
        error: '无权限查看此搭配',
      });
      return;
    }

    // 获取搭配中的衣物详情
    const clothIds = [outfit.topId, outfit.bottomId, outfit.shoesId, outfit.accessoryId].filter(Boolean) as string[];
    const clothes = db.data.clothes.filter(c => clothIds.includes(c.id));

    res.json({
      success: true,
      data: {
        ...outfit,
        clothes,
      },
    });
  } catch (error) {
    console.error('Get outfit error:', error);
    res.status(500).json({
      success: false,
      error: '获取搭配详情失败',
    });
  }
});

/**
 * 删除搭配
 * DELETE /api/outfits/:id
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: { message }
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 查找搭配
    const outfitIndex = db.data.outfits.findIndex(o => o.id === id);
    if (outfitIndex === -1) {
      res.status(404).json({
        success: false,
        error: '搭配不存在',
      });
      return;
    }

    const outfit = db.data.outfits[outfitIndex];

    // 验证权限
    if (outfit.userId !== userId) {
      res.status(403).json({
        success: false,
        error: '无权限删除此搭配',
      });
      return;
    }

    // 从数据库中删除
    db.data.outfits.splice(outfitIndex, 1);
    await db.write();

    res.json({
      success: true,
      data: { message: '删除成功' },
    });
  } catch (error) {
    console.error('Delete outfit error:', error);
    res.status(500).json({
      success: false,
      error: '删除搭配失败',
    });
  }
});

export default router;
