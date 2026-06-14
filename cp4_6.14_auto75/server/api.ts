import { Router, type Request, type Response } from 'express';
import {
  getRandomItem,
  submitScore as dbSubmitScore,
  getRankings,
  getItemCount,
} from './database';

const router = Router();

router.get('/item', (_req: Request, res: Response): void => {
  try {
    const item = getRandomItem();
    res.status(200).json({
      success: true,
      data: item,
      total: getItemCount(),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: '获取物品失败' });
  }
});

router.post('/score', (req: Request, res: Response): void => {
  try {
    const { playerName, score, accuracy, duration } = req.body ?? {};
    if (
      typeof playerName !== 'string' ||
      typeof score !== 'number' ||
      typeof accuracy !== 'number' ||
      typeof duration !== 'number'
    ) {
      res.status(400).json({ success: false, error: '参数错误' });
      return;
    }
    const result = dbSubmitScore(playerName, score, accuracy, duration);
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: '提交分数失败' });
  }
});

router.get('/ranking', (req: Request, res: Response): void => {
  try {
    const limitRaw = req.query.limit;
    const limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : 100;
    const list = getRankings(isNaN(limit) ? 100 : limit);
    res.status(200).json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, error: '获取排行失败' });
  }
});

export default router;
