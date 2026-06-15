import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import { verifyToken } from './auth.js';
import type { ResourceType, ReportStats } from '../types.js';

const router = Router();

function authMiddleware(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, error: '令牌无效' });
    return;
  }
  (req as Request & { userId: string }).userId = payload.userId;
  next();
}

const typeLabels: Record<ResourceType, string> = {
  sprite: '精灵图',
  background: '背景',
  ui: 'UI元素',
  audio: '音效',
};

router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, startDate, endDate, frequency } = req.query as {
      type?: string;
      startDate?: string;
      endDate?: string;
      frequency?: 'daily' | 'weekly';
    };
    const userId = (req as Request & { userId: string }).userId;
    const db = await getDb();

    let resources = db.data.resources.filter(r => r.userId === userId);
    const allVersions = db.data.versions;

    if (type) {
      const types = type.split(',');
      resources = resources.filter(r => types.includes(r.type));
    }
    if (startDate) resources = resources.filter(r => r.createdAt >= startDate);
    if (endDate) resources = resources.filter(r => r.createdAt <= endDate + 'T23:59:59');

    const byTypeMap: Record<string, { count: number; totalSize: number }> = {};
    for (const r of resources) {
      if (!byTypeMap[r.type]) byTypeMap[r.type] = { count: 0, totalSize: 0 };
      byTypeMap[r.type].count++;
      byTypeMap[r.type].totalSize += r.size;
    }
    const byType = Object.entries(byTypeMap).map(([t, v]) => ({
      type: (typeLabels as Record<string, string>)[t] || t,
      typeKey: t,
      count: v.count,
      totalSize: v.totalSize,
    }));

    const days = frequency === 'weekly' ? 8 : 14;
    const trend: { date: string; uploads: number; modifications: number }[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextStr = nextDate.toISOString().slice(0, 10);

      const uploads = resources.filter(r => r.createdAt >= dateStr && r.createdAt < nextStr).length;
      const modifications = allVersions.filter(v => {
        const r = resources.find(x => x.id === v.resourceId);
        return r && v.createdAt >= dateStr && v.createdAt < nextStr && v.versionNumber > 1;
      }).length;

      trend.push({ date: dateStr, uploads, modifications });
    }

    const totalResources = resources.length;
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    let totalVersions = 0;
    for (const r of resources) {
      totalVersions += allVersions.filter(v => v.resourceId === r.id).length;
    }

    const report: ReportStats = {
      byType,
      trend,
      summary: {
        totalResources,
        totalSize,
        avgVersions: totalResources > 0 ? Number((totalVersions / totalResources).toFixed(2)) : 0,
      },
    };

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: '生成报告失败' });
  }
});

export default router;
