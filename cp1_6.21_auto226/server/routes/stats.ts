import { Router, Request, Response } from 'express';
import { getData } from '../data';

const router = Router();

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

router.get('/daily', (req: Request, res: Response) => {
  const daysParam = req.query.days;
  const days = daysParam ? parseInt(String(daysParam), 10) : 7;
  const validDays = isNaN(days) || days < 1 ? 7 : days;

  const result: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = validDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({ date: formatDate(d), count: 0 });
  }

  const data = getData();
  data.forEach((item) => {
    const created = new Date(item.createdAt);
    created.setHours(0, 0, 0, 0);
    const dateStr = formatDate(created);
    const entry = result.find((r) => r.date === dateStr);
    if (entry) {
      entry.count++;
    }
  });

  res.json(result);
});

router.get('/status', (_req: Request, res: Response) => {
  const data = getData();
  const result: Record<string, number> = {
    '进行中': 0,
    '已实现': 0,
    '已归档': 0,
  };

  data.forEach((item) => {
    if (result[item.status] !== undefined) {
      result[item.status]++;
    }
  });

  res.json(result);
});

export default router;
