import { Router, Request, Response } from 'express';
import { feedbacks } from './feedbackRoutes';
import type { Feedback } from './feedbackRoutes';

const router = Router();

interface StatsPoint {
  date: string;
  avgMood: number;
  avgEfficiency: number;
}

router.get('/', (req: Request, res: Response) => {
  const group = (req.query.group as string) || 'all';
  const range = parseInt((req.query.range as string) || '7', 10);

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - range + 1);
  startDate.setHours(0, 0, 0, 0);

  let filtered = feedbacks.filter((f) => {
    const createdAt = new Date(f.createdAt);
    return createdAt >= startDate;
  });

  if (group !== 'all') {
    filtered = filtered.filter((f) => f.userGroup === group);
  }

  const dateMap = new Map<string, { moods: number[]; efficiencies: number[] }>();

  for (let i = 0; i < range; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (range - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    dateMap.set(dateStr, { moods: [], efficiencies: [] });
  }

  filtered.forEach((f: Feedback) => {
    const dateStr = new Date(f.createdAt).toISOString().split('T')[0];
    if (dateMap.has(dateStr)) {
      const entry = dateMap.get(dateStr)!;
      entry.moods.push(f.mood);
      entry.efficiencies.push(f.efficiency);
    }
  });

  const data: StatsPoint[] = [];
  dateMap.forEach((value, key) => {
    const avgMood = value.moods.length > 0
      ? parseFloat((value.moods.reduce((a, b) => a + b, 0) / value.moods.length).toFixed(2))
      : 0;
    const avgEfficiency = value.efficiencies.length > 0
      ? parseFloat((value.efficiencies.reduce((a, b) => a + b, 0) / value.efficiencies.length).toFixed(2))
      : 0;
    data.push({ date: key, avgMood, avgEfficiency });
  });

  data.sort((a, b) => a.date.localeCompare(b.date));

  res.json({ success: true, data });
});

export default router;
