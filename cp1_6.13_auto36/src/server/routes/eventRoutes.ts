import { Router, Request, Response } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  getEventByCode,
} from '../services/eventService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location, maxParticipants } = req.body;
    const event = createEvent({
      title,
      description,
      startTime,
      endTime,
      location,
      maxParticipants,
    });
    res.status(201).json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', (req: Request, res: Response) => {
  const { status, keyword, page, limit } = req.query;
  const result = getEvents({
    status: status as string | undefined,
    keyword: keyword as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  res.json(result);
});

router.get('/:id', (req: Request, res: Response) => {
  const event = getEventById(req.params.id);
  if (!event) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }
  res.json(event);
});

router.get('/:id/qrcode', (req: Request, res: Response) => {
  const event = getEventById(req.params.id);
  if (!event) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }
  res.json({ code: event.code, eventTitle: event.title });
});

export default router;
