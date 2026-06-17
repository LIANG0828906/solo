import express, { type Request, type Response } from 'express';
import { getAllGardens } from '../store.js';
import type { WeeklyWaterData, CarbonData, MonthlyReport } from '../../shared/types.js';

const router = express.Router();

function getWeekKey(timestamp: number): string {
  const d = new Date(timestamp);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `第${weekNum}周`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

router.get('/weekly-water', (_req: Request, res: Response) => {
  const gardens = getAllGardens();
  const weekMap = new Map<string, number>();

  const now = Date.now();
  for (let i = 3; i >= 0; i--) {
    const ts = now - i * 7 * 24 * 60 * 60 * 1000;
    weekMap.set(getWeekKey(ts), 0);
  }

  for (const g of gardens) {
    for (const log of g.waterLogs) {
      const key = getWeekKey(log.timestamp);
      if (weekMap.has(key)) {
        weekMap.set(key, (weekMap.get(key) || 0) + 1);
      }
    }
  }

  const data: WeeklyWaterData[] = Array.from(weekMap.entries()).map(([week, count]) => ({
    week,
    count,
  }));

  res.json({ success: true, data });
});

router.get('/carbon-reduction', (_req: Request, res: Response) => {
  const gardens = getAllGardens();
  const dayMap = new Map<string, number>();

  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const ts = now - i * 24 * 60 * 60 * 1000;
    dayMap.set(formatDate(ts), 0);
  }

  for (const g of gardens) {
    for (const log of g.waterLogs) {
      const key = formatDate(log.timestamp);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + log.amount * 0.0002);
      }
    }
  }

  const entries = Array.from(dayMap.entries());
  let cumulative = 0;
  const data: CarbonData[] = entries.map(([date, kg]) => {
    cumulative += Math.round(kg * 100) / 100;
    return { date, kg: Math.round(cumulative * 100) / 100 };
  });

  res.json({ success: true, data });
});

router.get('/monthly', (_req: Request, res: Response) => {
  const gardens = getAllGardens();
  let totalWaterCount = 0;
  let totalPlantingDays = 0;
  let matureCrops = 0;

  const now = Date.now();
  for (const g of gardens) {
    totalWaterCount += g.waterLogs.length;
    if (g.plantedAt) {
      totalPlantingDays += Math.max(0, Math.floor((now - g.plantedAt) / (24 * 60 * 60 * 1000)));
    }
    if (g.progress >= 100) {
      matureCrops += 1;
    }
  }

  const data: MonthlyReport = {
    totalWaterCount,
    totalPlantingDays,
    matureCrops,
  };

  res.json({ success: true, data });
});

export default router;
