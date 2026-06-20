import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { AuthRequest, authMiddleware } from './auth.js';
import { InspirationCard, Work } from '../../types.js';

const router = Router();

router.get('/work/:workId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { workId } = req.params;
    const userId = req.userId!;

    await db.read();
    const work = db.data!.works.find((w: Work) => w.id === workId);

    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (work.authorId !== userId && !work.collaborators.some((c) => c.userId === userId)) {
      return res.status(403).json({ error: '无权访问此作品' });
    }

    const cards = db.data!.inspirations
      .filter((c: InspirationCard) => c.workId === workId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.order !== b.order) return a.order - b.order;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 50);

    res.json(cards);
  } catch (error) {
    console.error('获取灵感卡片错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { content, color, priority, workId } = req.body;

    if (!content || !workId) {
      return res.status(400).json({ error: '请填写内容和作品ID' });
    }

    await db.read();
    const work = db.data!.works.find((w: Work) => w.id === workId);

    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }

    if (work.authorId !== userId && !work.collaborators.some((c) => c.userId === userId)) {
      return res.status(403).json({ error: '无权访问此作品' });
    }

    const maxOrder = Math.max(
      0,
      ...db.data!.inspirations
        .filter((c: InspirationCard) => c.workId === workId && !c.completed)
        .map((c) => c.order)
    );

    const card: InspirationCard = {
      id: uuidv4(),
      content,
      color: color || '#FFE4B5',
      priority: priority || 1,
      completed: false,
      order: maxOrder + 1,
      workId,
      authorId: userId,
      createdAt: new Date().toISOString(),
    };

    db.data!.inspirations.push(card);
    await db.write();

    res.status(201).json(card);
  } catch (error) {
    console.error('创建灵感卡片错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { content, color, priority, completed, order } = req.body;

    await db.read();
    const cardIndex = db.data!.inspirations.findIndex(
      (c: InspirationCard) => c.id === id
    );

    if (cardIndex === -1) {
      return res.status(404).json({ error: '灵感卡片不存在' });
    }

    const card = db.data!.inspirations[cardIndex];

    if (card.authorId !== userId) {
      return res.status(403).json({ error: '无权修改此卡片' });
    }

    if (content !== undefined) card.content = content;
    if (color !== undefined) card.color = color;
    if (priority !== undefined) card.priority = priority;
    if (completed !== undefined) card.completed = completed;
    if (order !== undefined) card.order = order;

    await db.write();
    res.json(card);
  } catch (error) {
    console.error('更新灵感卡片错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db.read();
    const cardIndex = db.data!.inspirations.findIndex(
      (c: InspirationCard) => c.id === id
    );

    if (cardIndex === -1) {
      return res.status(404).json({ error: '灵感卡片不存在' });
    }

    const card = db.data!.inspirations[cardIndex];

    if (card.authorId !== userId) {
      return res.status(403).json({ error: '无权删除此卡片' });
    }

    db.data!.inspirations.splice(cardIndex, 1);
    await db.write();

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除灵感卡片错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/batch/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: '卡片数据无效' });
    }

    await db.read();

    for (const { id, order, completed } of cards) {
      const cardIndex = db.data!.inspirations.findIndex(
        (c: InspirationCard) => c.id === id
      );
      if (cardIndex !== -1) {
        const card = db.data!.inspirations[cardIndex];
        if (card.authorId === userId) {
          card.order = order;
          if (completed !== undefined) card.completed = completed;
        }
      }
    }

    await db.write();
    res.json({ message: '排序更新成功' });
  } catch (error) {
    console.error('批量更新排序错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
