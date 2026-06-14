// ============================================================
// 交换请求路由
// 数据流向：客户端请求 → 认证中间件 → 数据库操作 → 返回结果
// 调用关系：server/index.ts 中注册，依赖 server/middleware/auth.ts 和 server/db.ts
// ============================================================

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import authMiddleware from '../middleware/auth.js';
import type { SwapRequest, SwapStatus } from '../../src/types/index.js';

const router = Router();

/**
 * 获取当前用户的交换请求（发起的和收到的）
 * GET /api/swaps
 * 
 * 需要认证
 * 
 * 查询参数：
 * - type: 可选，sent 或 received，默认全部
 * 
 * 响应：
 * - success: 是否成功
 * - data: { sent: [], received: [] } 或指定类型的数组
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { type } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 获取发起的交换请求
    const sentRequests = db.data.swapRequests
      .filter(s => s.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 获取收到的交换请求
    const receivedRequests = db.data.swapRequests
      .filter(s => s.toUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 根据 type 参数返回对应的数据
    if (type === 'sent') {
      res.json({
        success: true,
        data: sentRequests,
      });
    } else if (type === 'received') {
      res.json({
        success: true,
        data: receivedRequests,
      });
    } else {
      res.json({
        success: true,
        data: {
          sent: sentRequests,
          received: receivedRequests,
        },
      });
    }
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({
      success: false,
      error: '获取交换请求失败',
    });
  }
});

/**
 * 发起交换请求
 * POST /api/swaps
 * 
 * 需要认证
 * 
 * 请求体：
 * - toUserId: 目标用户 ID
 * - offeredClothId: 发起方提供的衣物 ID
 * - requestedClothId: 发起方请求的衣物 ID
 * 
 * 响应：
 * - success: 是否成功
 * - data: 新创建的交换请求对象
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const fromUserId = req.user?.userId;
    const { toUserId, offeredClothId, requestedClothId } = req.body;

    if (!fromUserId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 参数验证
    if (!toUserId || !offeredClothId || !requestedClothId) {
      res.status(400).json({
        success: false,
        error: '请提供完整的交换信息',
      });
      return;
    }

    // 不能向自己发起交换
    if (fromUserId === toUserId) {
      res.status(400).json({
        success: false,
        error: '不能向自己发起交换',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 检查目标用户是否存在
    const toUser = db.data.users.find(u => u.id === toUserId);
    if (!toUser) {
      res.status(404).json({
        success: false,
        error: '目标用户不存在',
      });
      return;
    }

    // 检查发起方的衣物是否存在且属于发起方
    const offeredCloth = db.data.clothes.find(c => c.id === offeredClothId);
    if (!offeredCloth) {
      res.status(404).json({
        success: false,
        error: '提供的衣物不存在',
      });
      return;
    }
    if (offeredCloth.userId !== fromUserId) {
      res.status(403).json({
        success: false,
        error: '提供的衣物不属于你',
      });
      return;
    }

    // 检查请求的衣物是否存在且属于目标用户
    const requestedCloth = db.data.clothes.find(c => c.id === requestedClothId);
    if (!requestedCloth) {
      res.status(404).json({
        success: false,
        error: '请求的衣物不存在',
      });
      return;
    }
    if (requestedCloth.userId !== toUserId) {
      res.status(403).json({
        success: false,
        error: '请求的衣物不属于目标用户',
      });
      return;
    }

    // 检查是否已有相同的待处理交换请求
    const existingRequest = db.data.swapRequests.find(
      s => s.fromUserId === fromUserId
        && s.toUserId === toUserId
        && s.offeredClothId === offeredClothId
        && s.requestedClothId === requestedClothId
        && s.status === 'pending'
    );
    if (existingRequest) {
      res.status(400).json({
        success: false,
        error: '已有相同的待处理交换请求',
      });
      return;
    }

    // 创建交换请求
    const now = new Date().toISOString();
    const swapRequest: SwapRequest = {
      id: uuidv4(),
      fromUserId,
      toUserId,
      offeredClothId,
      requestedClothId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // 保存到数据库
    db.data.swapRequests.push(swapRequest);
    await db.write();

    res.status(201).json({
      success: true,
      data: swapRequest,
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({
      success: false,
      error: '发起交换请求失败',
    });
  }
});

/**
 * 接受交换
 * PATCH /api/swaps/:id/accept
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: 更新后的交换请求对象
 */
router.patch('/:id/accept', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

    // 查找交换请求
    const swapRequest = db.data.swapRequests.find(s => s.id === id);
    if (!swapRequest) {
      res.status(404).json({
        success: false,
        error: '交换请求不存在',
      });
      return;
    }

    // 验证权限（只有接收方才能接受）
    if (swapRequest.toUserId !== userId) {
      res.status(403).json({
        success: false,
        error: '无权限接受此交换请求',
      });
      return;
    }

    // 检查状态
    if (swapRequest.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: '交换请求状态不是待处理',
      });
      return;
    }

    // 交换双方衣物归属
    const offeredCloth = db.data.clothes.find(c => c.id === swapRequest.offeredClothId);
    const requestedCloth = db.data.clothes.find(c => c.id === swapRequest.requestedClothId);

    if (!offeredCloth || !requestedCloth) {
      res.status(404).json({
        success: false,
        error: '交换的衣物不存在',
      });
      return;
    }

    // 交换衣物所有权
    const tempUserId = offeredCloth.userId;
    offeredCloth.userId = requestedCloth.userId;
    requestedCloth.userId = tempUserId;

    // 更新交换请求状态
    swapRequest.status = 'accepted' as SwapStatus;
    swapRequest.updatedAt = new Date().toISOString();

    // 保存到数据库
    await db.write();

    res.json({
      success: true,
      data: swapRequest,
    });
  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({
      success: false,
      error: '接受交换请求失败',
    });
  }
});

/**
 * 拒绝交换
 * PATCH /api/swaps/:id/reject
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: 更新后的交换请求对象
 */
router.patch('/:id/reject', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

    // 查找交换请求
    const swapRequest = db.data.swapRequests.find(s => s.id === id);
    if (!swapRequest) {
      res.status(404).json({
        success: false,
        error: '交换请求不存在',
      });
      return;
    }

    // 验证权限（只有接收方才能拒绝）
    if (swapRequest.toUserId !== userId) {
      res.status(403).json({
        success: false,
        error: '无权限拒绝此交换请求',
      });
      return;
    }

    // 检查状态
    if (swapRequest.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: '交换请求状态不是待处理',
      });
      return;
    }

    // 更新交换请求状态
    swapRequest.status = 'rejected' as SwapStatus;
    swapRequest.updatedAt = new Date().toISOString();

    // 保存到数据库
    await db.write();

    res.json({
      success: true,
      data: swapRequest,
    });
  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({
      success: false,
      error: '拒绝交换请求失败',
    });
  }
});

export default router;
