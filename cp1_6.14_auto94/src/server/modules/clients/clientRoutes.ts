import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../shared/db.js';
import type { Client } from '../../../shared/types/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const db = await getDb();
    res.json(db.data.clients);
  } catch (err) {
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const client = db.data.clients.find((c) => c.id === req.params.id);
    if (!client) {
      res.status(404).json({ error: '客户不存在' });
      return;
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: '获取客户信息失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { name, age, goal, location, baselineScores } = req.body as Omit<Client, 'id' | 'createdAt'>;
    if (!name || !age || !goal || !location || !baselineScores) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    const newClient: Client = {
      id: uuidv4(),
      name,
      age,
      goal,
      location,
      baselineScores,
      createdAt: new Date().toISOString(),
    };
    db.data.clients.push(newClient);
    await db.write();
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: '创建客户失败' });
  }
});

router.put('/:id/baseline', async (req, res) => {
  try {
    const db = await getDb();
    const client = db.data.clients.find((c) => c.id === req.params.id);
    if (!client) {
      res.status(404).json({ error: '客户不存在' });
      return;
    }
    const { baselineScores } = req.body;
    if (!baselineScores) {
      res.status(400).json({ error: '缺少基线分数数据' });
      return;
    }
    client.baselineScores = baselineScores;
    await db.write();
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: '更新基线分数失败' });
  }
});

export default router;
