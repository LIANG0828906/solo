import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface Participant {
  id: string;
  name: string;
  phone: string;
  enrolledAt: Date;
  signedIn: boolean;
  signedInAt?: Date;
}

interface Event {
  id: string;
  name: string;
  date: string;
  duration: number;
  location: string;
  capacity: number;
  participants: Participant[];
  createdAt: Date;
}

let events: Event[] = [
  {
    id: uuidv4(),
    name: '2024社区技术分享会',
    date: '2024-12-20',
    duration: 120,
    location: '社区活动中心A厅',
    capacity: 50,
    participants: [
      {
        id: uuidv4(),
        name: '张三',
        phone: '13800138001',
        enrolledAt: new Date(),
        signedIn: false
      }
    ],
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    name: '亲子手工DIY活动',
    date: '2024-12-25',
    duration: 90,
    location: '社区文化站',
    capacity: 30,
    participants: [],
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    name: '老年人健康讲座',
    date: '2024-12-28',
    duration: 60,
    location: '社区卫生服务中心',
    capacity: 40,
    participants: [],
    createdAt: new Date()
  }
];

app.get('/api/events', (_req: Request, res: Response) => {
  res.json(events);
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: '活动不存在' });
  }
  res.json(event);
});

app.post('/api/events', (req: Request, res: Response) => {
  const { name, date, duration, location, capacity } = req.body;
  
  if (!name || !date || !duration || !location || !capacity) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  
  if (capacity < 10 || capacity > 200) {
    return res.status(400).json({ error: '总名额必须在10-200之间' });
  }

  const newEvent: Event = {
    id: uuidv4(),
    name,
    date,
    duration,
    location,
    capacity,
    participants: [],
    createdAt: new Date()
  };

  events.unshift(newEvent);
  res.status(201).json(newEvent);
});

app.post('/api/events/:id/enroll', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: '活动不存在' });
  }

  if (event.participants.length >= event.capacity) {
    return res.status(400).json({ error: '活动名额已满' });
  }

  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: '请填写姓名和手机号' });
  }

  const alreadyEnrolled = event.participants.some(p => p.phone === phone);
  if (alreadyEnrolled) {
    return res.status(400).json({ error: '该手机号已报名此活动' });
  }

  const participant: Participant = {
    id: uuidv4(),
    name,
    phone,
    enrolledAt: new Date(),
    signedIn: false
  };

  event.participants.push(participant);
  res.status(201).json({ event, participant });
});

app.put('/api/events/:id/signin/:participantId', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const participant = event.participants.find(p => p.id === req.params.participantId);
  if (!participant) {
    return res.status(404).json({ error: '参与者不存在' });
  }

  if (participant.signedIn) {
    return res.status(400).json({ error: '已完成签到' });
  }

  participant.signedIn = true;
  participant.signedInAt = new Date();
  res.json({ event, participant });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
