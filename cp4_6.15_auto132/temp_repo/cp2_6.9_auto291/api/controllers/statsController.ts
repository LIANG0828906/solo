import { Request, Response } from 'express';
import Mission from '../models/Mission';

export const getSuccessRate = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const missions = await Mission.find({
      createdAt: { $gte: sevenDaysAgo },
      status: { $in: ['success', 'failed'] }
    });

    const dailyStats: { [key: string]: { total: number; success: number } } = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { total: 0, success: 0 };
    }

    for (const mission of missions) {
      const dateStr = new Date(mission.createdAt).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total += 1;
        if (mission.status === 'success') {
          dailyStats[dateStr].success += 1;
        }
      }
    }

    const result = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Get success rate error:', error);
    res.status(500).json({ message: '获取成功率数据失败' });
  }
};
