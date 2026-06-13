import { Router, Request, Response } from 'express';
import {
  validateCreateEventData,
  createNewEvent,
  listEvents,
  getEventDetail,
  getEventQRCode,
} from '../services/eventService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const validation = validateCreateEventData(req.body);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const event = createNewEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: '创建活动失败' });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;
    const keyword = req.query.keyword as string | undefined;

    const result = listEvents(page, pageSize, status, keyword);
    res.json(result);
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ message: '获取活动列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detail = getEventDetail(id);
    if (!detail) {
      res.status(404).json({ message: '活动不存在' });
      return;
    }
    res.json(detail);
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ message: '获取活动详情失败' });
  }
});

router.get('/:id/qrcode', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const qr = getEventQRCode(id);
    if (!qr) {
      res.status(404).json({ message: '活动不存在' });
      return;
    }
    res.json(qr);
  } catch (err) {
    console.error('Get QR code error:', err);
    res.status(500).json({ message: '获取二维码失败' });
  }
});

export default router;
