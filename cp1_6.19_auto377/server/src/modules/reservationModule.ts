import { Router, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { devices } from './deviceModule';

export interface Reservation {
  id: string;
  deviceId: string;
  deviceName: string;
  userName: string;
  startDate: string;
  endDate: string;
  timeSlots: ('上午' | '下午' | '晚上')[];
  createdAt: string;
}

interface StockCheckRequest {
  deviceId: string;
  startDate: string;
  endDate: string;
  timeSlots: string[];
}

let reservations: Reservation[] = [
  {
    id: uuidv4(),
    deviceId: devices[0].id,
    deviceName: devices[0].name,
    userName: '张三',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    timeSlots: ['上午', '下午'],
    createdAt: '2026-05-28T10:00:00Z',
  },
  {
    id: uuidv4(),
    deviceId: devices[3].id,
    deviceName: devices[3].name,
    userName: '李四',
    startDate: '2026-06-10',
    endDate: '2026-06-20',
    timeSlots: ['下午', '晚上'],
    createdAt: '2026-06-05T14:30:00Z',
  },
];

const reservationRouter = Router();

const countReservationsForDevice = (
  deviceId: string,
  startDate: string,
  endDate: string,
  timeSlots: string[]
): number => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dateRange = eachDayOfInterval({ start, end });

  let maxConcurrent = 0;

  for (const date of dateRange) {
    for (const slot of timeSlots) {
      const count = reservations.filter((r) => {
        const rStart = parseISO(r.startDate);
        const rEnd = parseISO(r.endDate);
        const rDateRange = eachDayOfInterval({ start: rStart, end: rEnd });
        const dateOverlap = rDateRange.some((d) => isSameDay(d, date));
        const slotOverlap = r.timeSlots.includes(slot as '上午' | '下午' | '晚上');
        return r.deviceId === deviceId && dateOverlap && slotOverlap;
      }).length;
      maxConcurrent = Math.max(maxConcurrent, count);
    }
  }

  return maxConcurrent;
};

reservationRouter.get('/', (req, res) => {
  try {
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: '获取预约记录失败' });
  }
});

reservationRouter.post('/check-stock', (req: Request<{}, {}, StockCheckRequest>, res) => {
  try {
    const { deviceId, startDate, endDate, timeSlots } = req.body;

    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      return res.json({ available: false });
    }

    const concurrentCount = countReservationsForDevice(deviceId, startDate, endDate, timeSlots);
    const available = concurrentCount < device.stock;

    res.json({ available });
  } catch (error) {
    res.status(500).json({ error: '检查库存失败' });
  }
});

reservationRouter.post('/', (req, res) => {
  try {
    const { deviceId, userName, startDate, endDate, timeSlots } = req.body;

    if (!deviceId || !userName || !startDate || !endDate || !timeSlots || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的预约信息',
      });
    }

    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: '设备不存在',
      });
    }

    const concurrentCount = countReservationsForDevice(deviceId, startDate, endDate, timeSlots);
    if (concurrentCount >= device.stock) {
      return res.status(400).json({
        success: false,
        message: '当前时段该设备已满，请选择其他时段',
      });
    }

    const newReservation: Reservation = {
      id: uuidv4(),
      deviceId,
      deviceName: device.name,
      userName,
      startDate,
      endDate,
      timeSlots,
      createdAt: new Date().toISOString(),
    };

    reservations.push(newReservation);

    setTimeout(() => {
      res.json({
        success: true,
        message: '预约成功！',
        reservation: newReservation,
      });
    }, 800);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '预约失败，请稍后重试',
    });
  }
});

reservationRouter.delete('/:id', (req, res) => {
  try {
    const index = reservations.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '预约记录不存在',
      });
    }
    reservations.splice(index, 1);
    res.json({
      success: true,
      message: '预约已取消',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消预约失败',
    });
  }
});

export { reservationRouter };
