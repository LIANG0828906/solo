import { Router, Request, Response } from 'express';
import {
  submitCheckIn,
  getCheckInList,
  getDashboardStats,
} from '../services/eventService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { eventCode, participantName } = req.body;

    const result = submitCheckIn(eventCode, participantName);

    if (result.alreadyChecked) {
      res.json({
        id: result.record?.id,
        eventId: result.record?.eventId,
        eventTitle: result.record?.eventTitle,
        participantName: result.record?.participantName,
        checkInTime: result.record?.checkInTime,
        alreadyChecked: true,
        message: result.message || '已签到，不可重复签到',
      });
      return;
    }

    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.status(201).json({
      id: result.record!.id,
      eventId: result.record!.eventId,
      eventTitle: result.record!.eventTitle,
      participantName: result.record!.participantName,
      checkInTime: result.record!.checkInTime,
      alreadyChecked: false,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: '签到失败' });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const eventId = req.query.eventId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const records = getCheckInList(eventId, limit);
    res.json(records);
  } catch (err) {
    console.error('Get check-ins error:', err);
    res.status(500).json({ message: '获取签到记录失败' });
  }
});

router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

export default router;
