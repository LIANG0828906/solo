import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store.js';
import { Schedule } from '../types/index.js';
import { checkTimeConflict, formatConflictMessage } from '../utils/conflict.js';

let wss: any;

export function setWebSocketServer(wsServer: any) {
  wss = wsServer;
}

function broadcastSchedule(message: any) {
  if (wss && wss.clients) {
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { stage } = req.query;
  let schedules = store.schedules;

  if (stage && typeof stage === 'string') {
    schedules = schedules.filter(s => s.stage === stage);
  }

  schedules.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  res.json(schedules);
});

router.get('/:id', (req: Request, res: Response) => {
  const schedule = store.schedules.find(s => s.id === req.params.id);
  if (!schedule) {
    return res.status(404).json({ message: '排期不存在' });
  }
  res.json(schedule);
});

router.post('/', (req: Request, res: Response) => {
  const { bandId, stage, startTime, endTime } = req.body;

  if (!bandId || !stage || !startTime || !endTime) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  const band = store.bands.find(b => b.id === bandId);
  if (!band) {
    return res.status(404).json({ message: '乐队不存在' });
  }

  if (band.status !== 'approved') {
    return res.status(400).json({ message: '该乐队未通过审核，无法安排排期' });
  }

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (start >= end) {
    return res.status(400).json({ message: '结束时间必须晚于开始时间' });
  }

  const conflict = checkTimeConflict(store.schedules, stage, startTime, endTime);
  if (conflict) {
    return res.status(400).json({
      message: formatConflictMessage(conflict),
      conflict
    });
  }

  const newSchedule: Schedule = {
    id: uuidv4(),
    bandId,
    bandName: band.name,
    stage,
    startTime,
    endTime,
    genres: band.genres
  };

  store.schedules.push(newSchedule);

  broadcastSchedule({
    type: 'schedule_create',
    data: newSchedule
  });

  res.status(201).json(newSchedule);
});

router.put('/:id', (req: Request, res: Response) => {
  const scheduleIndex = store.schedules.findIndex(s => s.id === req.params.id);
  if (scheduleIndex === -1) {
    return res.status(404).json({ message: '排期不存在' });
  }

  const { stage, startTime, endTime } = req.body;
  const schedule = store.schedules[scheduleIndex];

  const checkStage = stage || schedule.stage;
  const checkStart = startTime || schedule.startTime;
  const checkEnd = endTime || schedule.endTime;

  const conflict = checkTimeConflict(
    store.schedules,
    checkStage,
    checkStart,
    checkEnd,
    schedule.id
  );

  if (conflict) {
    return res.status(400).json({
      message: formatConflictMessage(conflict),
      conflict
    });
  }

  if (stage) schedule.stage = stage;
  if (startTime) schedule.startTime = startTime;
  if (endTime) schedule.endTime = endTime;

  broadcastSchedule({
    type: 'schedule_update',
    data: schedule
  });

  res.json(schedule);
});

router.delete('/:id', (req: Request, res: Response) => {
  const scheduleIndex = store.schedules.findIndex(s => s.id === req.params.id);
  if (scheduleIndex === -1) {
    return res.status(404).json({ message: '排期不存在' });
  }

  const deletedId = store.schedules[scheduleIndex].id;
  store.schedules.splice(scheduleIndex, 1);

  broadcastSchedule({
    type: 'schedule_delete',
    data: { id: deletedId }
  });

  res.json({ message: '排期已删除' });
});

export default router;
