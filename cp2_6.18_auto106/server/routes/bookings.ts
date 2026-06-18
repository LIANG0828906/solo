import { Router, Request, Response } from 'express';
import { bookingService, CreateBookingData } from '../models/booking';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { resourceType, resourceId, userName, startTime, endTime, purpose } = req.body;

  if (!resourceType || !['desk', 'room'].includes(resourceType)) {
    return res.status(400).json({ error: '资源类型必须是 desk 或 room' });
  }
  if (!resourceId || typeof resourceId !== 'string' || resourceId.trim() === '') {
    return res.status(400).json({ error: '请输入资源编号' });
  }
  if (!userName || typeof userName !== 'string' || userName.trim() === '') {
    return res.status(400).json({ error: '请输入用户名' });
  }
  if (!startTime || !endTime || isNaN(new Date(startTime).getTime()) || isNaN(new Date(endTime).getTime())) {
    return res.status(400).json({ error: '请选择有效的开始和结束时间' });
  }
  if (purpose === undefined || purpose === null || typeof purpose !== 'string' || purpose.length > 100) {
    return res.status(400).json({ error: '用途描述不能超过100字' });
  }

  const data: CreateBookingData = {
    resourceType,
    resourceId: resourceId.trim(),
    userName: userName.trim(),
    startTime,
    endTime,
    purpose: purpose.trim(),
  };

  const result = bookingService.create(data);

  if (!result.success) {
    if (result.conflict) {
      return res.status(409).json({ error: result.message });
    }
    return res.status(400).json({ error: result.message });
  }

  return res.status(201).json(result.booking);
});

router.get('/', (_req: Request, res: Response) => {
  const bookings = bookingService.list();
  return res.status(200).json(bookings);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = bookingService.remove(id);

  if (!success) {
    return res.status(404).json({ error: '预订不存在' });
  }

  return res.status(200).json({ message: '预订已取消' });
});

export default router;
