import { Router, Request, Response } from 'express';
import { create, list, remove, CreateBookingData } from '../models/booking';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const data = req.body as Partial<CreateBookingData>;

  if (
    !data.resourceType ||
    !data.resourceId ||
    !data.userName ||
    !data.startTime ||
    !data.endTime ||
    !data.purpose
  ) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  if (data.resourceType !== 'desk' && data.resourceType !== 'room') {
    return res.status(400).json({ error: '资源类型必须是 desk 或 room' });
  }

  if (data.purpose.length > 100) {
    return res.status(400).json({ error: '用途描述不能超过100字' });
  }

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return res.status(400).json({ error: '时间格式无效' });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ error: '结束时间必须晚于开始时间' });
  }

  const result = create(data as CreateBookingData);

  if ('conflict' in result) {
    return res.status(409).json({ error: result.message });
  }

  return res.status(201).json(result);
});

router.get('/', (_req: Request, res: Response) => {
  const bookings = list();
  return res.status(200).json(bookings);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = remove(id);

  if (!success) {
    return res.status(404).json({ error: '预订不存在' });
  }

  return res.status(204).send();
});

export default router;
