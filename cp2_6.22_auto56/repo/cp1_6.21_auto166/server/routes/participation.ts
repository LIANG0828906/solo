import { Router, Request, Response } from 'express';
import { ApiResponse, LotteryConfig, Participation, VoteConfig } from '../types';
import { activities, participations, generateId } from '../data';

const router = Router();

router.post('/verify', (req: Request, res: Response<ApiResponse<{ canParticipate: boolean; activityId?: string }>>) => {
  const { identifier, code } = req.body;

  if (!identifier || !code) {
    return res.status(400).json({ success: false, message: '缺少标识符或活动码' });
  }

  const activity = activities.find(a => a.code === code.toUpperCase());
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const hasParticipated = participations.some(
    p => p.activityId === activity.id && p.identifier === identifier
  );

  if (hasParticipated) {
    return res.json({ success: true, data: { canParticipate: false, activityId: activity.id } });
  }

  res.json({ success: true, data: { canParticipate: true, activityId: activity.id } });
});

router.post('/lottery', (req: Request, res: Response<ApiResponse<{ won: boolean; prizeName?: string }>>) => {
  const { identifier, code } = req.body;

  if (!identifier || !code) {
    return res.status(400).json({ success: false, message: '缺少标识符或活动码' });
  }

  const activity = activities.find(a => a.code === code.toUpperCase());
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  if (activity.type !== 'lottery') {
    return res.status(400).json({ success: false, message: '该活动不是抽奖活动' });
  }

  const hasParticipated = participations.some(
    p => p.activityId === activity.id && p.identifier === identifier
  );
  if (hasParticipated) {
    return res.status(400).json({ success: false, message: '您已参与过此活动' });
  }

  const config = activity.config as LotteryConfig;
  const activityParticipations = participations.filter(p => p.activityId === activity.id);
  const winnerCount = activityParticipations.filter(p => p.result === 'win').length;

  let won = false;
  const remainingWinners = config.winnerCount - winnerCount;
  const remainingSlots = Math.max(0, config.winnerCount * 3 - activityParticipations.length);

  if (remainingWinners > 0 && remainingSlots > 0) {
    const probability = remainingWinners / remainingSlots;
    won = Math.random() < probability;
  }

  const participation: Participation = {
    id: generateId(),
    activityId: activity.id,
    identifier,
    type: 'lottery',
    result: won ? 'win' : 'lose',
    timestamp: new Date().toISOString()
  };
  participations.push(participation);

  res.json({
    success: true,
    data: { won, prizeName: won ? config.prizeName : undefined }
  });
});

router.post('/vote', (req: Request, res: Response<ApiResponse<{ option: string; voteCounts: Record<string, number> }>>) => {
  const { identifier, code, option } = req.body;

  if (!identifier || !code || option === undefined) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  const activity = activities.find(a => a.code === code.toUpperCase());
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  if (activity.type !== 'vote') {
    return res.status(400).json({ success: false, message: '该活动不是投票活动' });
  }

  const config = activity.config as VoteConfig;
  if (!config.options.includes(option)) {
    return res.status(400).json({ success: false, message: '无效的投票选项' });
  }

  const hasParticipated = participations.some(
    p => p.activityId === activity.id && p.identifier === identifier
  );
  if (hasParticipated) {
    return res.status(400).json({ success: false, message: '您已参与过此活动' });
  }

  const participation: Participation = {
    id: generateId(),
    activityId: activity.id,
    identifier,
    type: 'vote',
    result: option,
    timestamp: new Date().toISOString()
  };
  participations.push(participation);

  const voteCounts: Record<string, number> = {};
  config.options.forEach(opt => { voteCounts[opt] = 0; });
  participations
    .filter(p => p.activityId === activity.id)
    .forEach(p => { voteCounts[p.result] = (voteCounts[p.result] || 0) + 1; });

  res.json({ success: true, data: { option, voteCounts } });
});

router.get('/:activityId', (req: Request, res: Response<ApiResponse<Participation[]>>) => {
  const activity = activities.find(a => a.id === req.params.activityId);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const activityParticipations = participations.filter(p => p.activityId === activity.id);
  res.json({ success: true, data: activityParticipations });
});

router.get('/:activityId/trend', (req: Request, res: Response<ApiResponse<{ hour: string; count: number }[]>>) => {
  const activity = activities.find(a => a.id === req.params.activityId);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const activityParticipations = participations.filter(p => p.activityId === activity.id);
  const hourMap: Record<string, number> = {};

  activityParticipations.forEach(p => {
    const date = new Date(p.timestamp);
    const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    hourMap[hourKey] = (hourMap[hourKey] || 0) + 1;
  });

  const trend = Object.entries(hourMap)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  res.json({ success: true, data: trend });
});

export default router;
