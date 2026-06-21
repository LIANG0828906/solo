import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Activity, Registration } from '../types.js';

const router = Router();

let activities: Activity[] = [
  {
    id: 'demo-1',
    name: '读书分享会 - 《百年孤独》',
    dateTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    location: '城市图书馆三楼阅读室',
    maxParticipants: 30,
    registrationDeadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
  {
    id: 'demo-2',
    name: '社区迷你马拉松',
    dateTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    location: '滨江公园南门广场',
    maxParticipants: 200,
    registrationDeadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
];

let registrations: Registration[] = [];

router.get('/', (req, res) => {
  res.json(activities);
});

router.get('/public', (req, res) => {
  const publicActivities = activities.filter((a) => a.isPublic);
  res.json(publicActivities);
});

router.get('/:id', (req, res) => {
  const activity = activities.find((a) => a.id === req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  res.json(activity);
});

router.post('/', (req, res) => {
  const { name, dateTime, location, maxParticipants, registrationDeadline, isPublic } = req.body;

  if (!name || name.length > 30) {
    return res.status(400).json({ error: '活动名称不能为空且最多30字' });
  }
  if (!dateTime || !location || !maxParticipants || !registrationDeadline) {
    return res.status(400).json({ error: '请填写所有必填项' });
  }

  const activity: Activity = {
    id: uuidv4(),
    name,
    dateTime,
    location,
    maxParticipants,
    registrationDeadline,
    createdAt: new Date().toISOString(),
    isPublic: isPublic ?? true,
  };

  activities.push(activity);
  res.status(201).json(activity);
});

router.put('/:id', (req, res) => {
  const index = activities.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '活动不存在' });
  }

  activities[index] = { ...activities[index], ...req.body };
  res.json(activities[index]);
});

router.delete('/:id', (req, res) => {
  const index = activities.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const deleted = activities.splice(index, 1);
  registrations = registrations.filter((r) => r.activityId !== req.params.id);
  res.json(deleted[0]);
});

router.get('/:id/registrations', (req, res) => {
  const activityRegistrations = registrations.filter((r) => r.activityId === req.params.id);
  res.json(activityRegistrations);
});

router.post('/:id/register', (req, res) => {
  const activity = activities.find((a) => a.id === req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const now = new Date();
  const deadline = new Date(activity.registrationDeadline);
  if (now > deadline) {
    return res.status(400).json({ error: '报名已截止' });
  }

  const activityRegistrations = registrations.filter((r) => r.activityId === req.params.id);
  if (activityRegistrations.length >= activity.maxParticipants) {
    return res.status(400).json({ error: '活动人数已满' });
  }

  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: '请填写完整报名信息' });
  }

  const existing = registrations.find(
    (r) => r.activityId === req.params.id && (r.email === email || r.phone === phone)
  );
  if (existing) {
    return res.status(400).json({ error: '您已报名此活动' });
  }

  const registrationId = uuidv4();
  const qrCode = `evt-${activity.id}-${registrationId}`;

  const registration: Registration = {
    id: registrationId,
    activityId: activity.id,
    name,
    email,
    phone,
    qrCode,
    registeredAt: new Date().toISOString(),
  };

  registrations.push(registration);
  res.status(201).json(registration);
});

router.get('/registration/:qrCode', (req, res) => {
  const registration = registrations.find((r) => r.qrCode === req.params.qrCode);
  if (!registration) {
    return res.status(404).json({ error: '报名记录不存在' });
  }
  res.json(registration);
});

export default router;
