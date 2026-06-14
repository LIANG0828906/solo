import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import type { Medical, ApiResponse } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response<ApiResponse<Medical[]>>) => {
  const { petId, type } = req.query;
  await db.read();
  let medical = db.data?.medical || [];

  if (petId) {
    medical = medical.filter((m) => m.petId === petId);
  }

  if (type && type !== 'all') {
    medical = medical.filter((m) => m.type === type);
  }

  medical.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json({ code: 0, message: 'success', data: medical });
});

router.post('/', async (req: Request, res: Response<ApiResponse<Medical>>) => {
  try {
    const { petId, type, date, notes } = req.body;

    const newMedical: Medical = {
      id: uuidv4(),
      petId,
      type,
      date,
      notes,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await db.read();
    db.data?.medical.push(newMedical);
    await db.write();

    res.json({ code: 0, message: '创建成功', data: newMedical });
  } catch (error) {
    res.json({ code: 1, message: (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response<ApiResponse<Medical>>) => {
  const { id } = req.params;
  await db.read();
  const medical = db.data?.medical || [];
  const index = medical.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.json({ code: 1, message: '医疗记录不存在' });
  }

  const updates = req.body;
  if (updates.completed && !medical[index].completed) {
    updates.completedAt = new Date().toISOString();
  }

  medical[index] = { ...medical[index], ...updates };
  await db.write();

  res.json({ code: 0, message: '更新成功', data: medical[index] });
});

router.delete('/:id', async (req: Request, res: Response<ApiResponse<null>>) => {
  const { id } = req.params;
  await db.read();

  if (db.data) {
    db.data.medical = db.data.medical.filter((m) => m.id !== id);
    await db.write();
  }

  res.json({ code: 0, message: '删除成功', data: null });
});

export default router;
