import { Router, Request, Response } from 'express';
import {
  checkIn,
  getCheckinsByEvent,
  getCheckinStats,
  getEventByCode,
} from '../services/eventService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { eventCode, participantName } = req.body;

  if (!eventCode || !participantName) {
    res.status(400).json({ error: '缺少活动码或参与者姓名' });
    return;
  }

  const event = getEventByCode(eventCode);
  if (!event) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }

  const result = checkIn(event.id, participantName);
  if (!result.success) {
    res.status(409).json({ message: result.message });
    return;
  }

  res.status(201).json(result);
});

router.get('/:eventId', (req: Request, res: Response) => {
  const records = getCheckinsByEvent(req.params.eventId);
  res.json(records);
});

router.get('/:eventId/stats', (req: Request, res: Response) => {
  const stats = getCheckinStats(req.params.eventId);
  res.json(stats);
});

export default router;
