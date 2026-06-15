import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import type { Record, Measurement, ApiResponse } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response<ApiResponse<Record[]>>) => {
  const { petId } = req.query;
  await db.read();
  let records = db.data?.records || [];

  if (petId) {
    records = records.filter((r) => r.petId === petId);
  }

  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ code: 0, message: 'success', data: records });
});

router.post('/', async (req: Request, res: Response<ApiResponse<Record>>) => {
  try {
    const { petId, type, date, time, duration, foodType, grams, startTime, route, note } = req.body;

    const newRecord: Record = {
      id: uuidv4(),
      petId,
      type,
      date,
      time,
      duration: duration ? parseFloat(duration) : undefined,
      foodType,
      grams: grams ? parseFloat(grams) : undefined,
      startTime,
      route,
      note,
      createdAt: new Date().toISOString(),
    };

    await db.read();
    db.data?.records.push(newRecord);
    await db.write();

    res.json({ code: 0, message: '创建成功', data: newRecord });
  } catch (error) {
    res.json({ code: 1, message: (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response<ApiResponse<Record>>) => {
  const { id } = req.params;
  await db.read();
  const records = db.data?.records || [];
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.json({ code: 1, message: '记录不存在' });
  }

  records[index] = { ...records[index], ...req.body };
  await db.write();

  res.json({ code: 0, message: '更新成功', data: records[index] });
});

router.delete('/:id', async (req: Request, res: Response<ApiResponse<null>>) => {
  const { id } = req.params;
  await db.read();

  if (db.data) {
    db.data.records = db.data.records.filter((r) => r.id !== id);
    await db.write();
  }

  res.json({ code: 0, message: '删除成功', data: null });
});

router.get('/measurements', async (req: Request, res: Response<ApiResponse<Measurement[]>>) => {
  const { petId } = req.query;
  await db.read();
  let measurements = db.data?.measurements || [];

  if (petId) {
    measurements = measurements.filter((m) => m.petId === petId);
  }

  measurements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json({ code: 0, message: 'success', data: measurements });
});

router.post('/measurements', async (req: Request, res: Response<ApiResponse<Measurement>>) => {
  try {
    const { petId, date, weight, length } = req.body;

    const newMeasurement: Measurement = {
      id: uuidv4(),
      petId,
      date,
      weight: parseFloat(weight),
      length: parseFloat(length),
      createdAt: new Date().toISOString(),
    };

    await db.read();
    db.data?.measurements.push(newMeasurement);
    await db.write();

    res.json({ code: 0, message: '创建成功', data: newMeasurement });
  } catch (error) {
    res.json({ code: 1, message: (error as Error).message });
  }
});

export default router;
