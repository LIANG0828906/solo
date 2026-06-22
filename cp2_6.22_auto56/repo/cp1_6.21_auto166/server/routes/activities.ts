import { Router, Request, Response } from 'express';
import { Activity, ActivitySummary, ActivityType, ApiResponse, LotteryConfig, VoteConfig } from '../types';
import { activities, participations, generateActivityCode, generateId } from '../data';

const router = Router();

router.get('/', (req: Request, res: Response<ApiResponse<ActivitySummary[]>>) => {
  const summaries: ActivitySummary[] = activities.map(activity => ({
    ...activity,
    participationCount: participations.filter(p => p.activityId === activity.id).length
  }));
  res.json({ success: true, data: summaries });
});

router.post('/', (req: Request, res: Response<ApiResponse<Activity>>) => {
  const { name, type, config } = req.body;

  if (!name || !type || !config) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (type !== 'lottery' && type !== 'vote') {
    return res.status(400).json({ success: false, message: '无效的活动类型' });
  }

  if (type === 'lottery') {
    const lotteryConfig = config as LotteryConfig;
    if (!lotteryConfig.prizeName || lotteryConfig.winnerCount === undefined || !lotteryConfig.deadline) {
      return res.status(400).json({ success: false, message: '抽奖活动配置不完整' });
    }
  }

  if (type === 'vote') {
    const voteConfig = config as VoteConfig;
    if (!voteConfig.options || !voteConfig.deadline) {
      return res.status(400).json({ success: false, message: '投票活动配置不完整' });
    }
  }

  const activity: Activity = {
    id: generateId(),
    code: generateActivityCode(),
    name,
    type: type as ActivityType,
    config,
    createdAt: new Date().toISOString()
  };

  activities.push(activity);
  res.json({ success: true, data: activity });
});

router.get('/:id', (req: Request, res: Response<ApiResponse<Activity>>) => {
  const activity = activities.find(a => a.id === req.params.id);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  res.json({ success: true, data: activity });
});

router.get('/code/:code', (req: Request, res: Response<ApiResponse<Activity>>) => {
  const activity = activities.find(a => a.code === req.params.code.toUpperCase());
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  res.json({ success: true, data: activity });
});

router.delete('/:id', (req: Request, res: Response<ApiResponse>) => {
  const index = activities.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  activities.splice(index, 1);
  const participationIndexes: number[] = [];
  participations.forEach((p, i) => {
    if (p.activityId === req.params.id) {
      participationIndexes.push(i);
    }
  });
  participationIndexes.reverse().forEach(i => participations.splice(i, 1));
  res.json({ success: true, message: '活动已删除' });
});

export default router;
