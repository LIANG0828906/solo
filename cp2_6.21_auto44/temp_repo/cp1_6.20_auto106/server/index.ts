import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import QRCode from 'qrcode';
import { dataStore, Event, Registration } from './dataStore.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface CheckinEvent {
  registrationId: string;
  name: string;
  checkinTime: string;
  checkinSequence: number;
}

app.get('/api/events', (req, res) => {
  try {
    const events = dataStore.getEvents();
    const eventsWithStats = events.map(event => {
      const stats = dataStore.getEventStats(event.id);
      return {
        ...event,
        registeredCount: stats.total,
        remainingCount: event.capacity - stats.total
      };
    });
    res.json(eventsWithStats);
  } catch (error) {
    res.status(500).json({ error: '获取活动列表失败' });
  }
});

app.get('/api/events/:id', (req, res) => {
  try {
    const event = dataStore.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    const stats = dataStore.getEventStats(event.id);
    res.json({
      ...event,
      registeredCount: stats.total,
      remainingCount: event.capacity - stats.total
    });
  } catch (error) {
    res.status(500).json({ error: '获取活动详情失败' });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { name, description, date, location, capacity, customQuestions } = req.body;
    
    if (!name || !description || !date || !location || !capacity) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const event = dataStore.createEvent({
      name,
      description,
      date,
      location,
      capacity: parseInt(capacity),
      customQuestions: customQuestions || []
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: '创建活动失败' });
  }
});

app.post('/api/events/:id/register', (req, res) => {
  try {
    const event = dataStore.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const stats = dataStore.getEventStats(event.id);
    if (stats.total >= event.capacity) {
      return res.status(400).json({ error: '活动名额已满' });
    }

    const { name, email, phone, customAnswers } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({ error: '手机号应为11位数字' });
    }

    const registration = dataStore.createRegistration(event.id, {
      name,
      email,
      phone,
      customAnswers: customAnswers || []
    });

    const qrCodeData = JSON.stringify({
      eventId: event.id,
      registrationId: registration.id
    });

    QRCode.toDataURL(qrCodeData, (err, qrcodeUrl) => {
      if (err) {
        return res.status(500).json({ error: '生成二维码失败' });
      }
      res.json({
        registrationId: registration.id,
        eventId: event.id,
        qrcodeUrl,
        name: registration.name,
        createdAt: registration.createdAt
      });
    });
  } catch (error) {
    res.status(500).json({ error: '报名失败' });
  }
});

app.get('/api/events/:id/registrations/:registrationId', (req, res) => {
  try {
    const registration = dataStore.getRegistrationById(req.params.id, req.params.registrationId);
    if (!registration) {
      return res.status(404).json({ error: '报名记录不存在' });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: '查询报名状态失败' });
  }
});

app.post('/api/events/:id/checkin', (req, res) => {
  try {
    const { registrationId } = req.body;
    
    if (!registrationId) {
      return res.status(400).json({ error: '缺少报名ID' });
    }

    const registration = dataStore.checkIn(req.params.id, registrationId);
    
    if (!registration) {
      return res.status(400).json({ error: '签到失败，该报名不存在或已签到' });
    }

    const checkinEvent: CheckinEvent = {
      registrationId: registration.id,
      name: registration.name,
      checkinTime: registration.checkinTime!,
      checkinSequence: registration.checkinSequence!
    };

    io.to(`event-${req.params.id}`).emit('checkin', checkinEvent);

    res.json({
      success: true,
      registration: {
        id: registration.id,
        name: registration.name,
        checkinTime: registration.checkinTime,
        checkinSequence: registration.checkinSequence
      }
    });
  } catch (error) {
    res.status(500).json({ error: '签到失败' });
  }
});

app.get('/api/events/:id/qrcode/:registrationId', (req, res) => {
  try {
    const registration = dataStore.getRegistrationById(req.params.id, req.params.registrationId);
    if (!registration) {
      return res.status(404).json({ error: '报名记录不存在' });
    }

    const qrCodeData = JSON.stringify({
      eventId: req.params.id,
      registrationId: req.params.registrationId
    });

    QRCode.toDataURL(qrCodeData, (err, qrcodeUrl) => {
      if (err) {
        return res.status(500).json({ error: '生成二维码失败' });
      }
      res.json({ qrcodeUrl });
    });
  } catch (error) {
    res.status(500).json({ error: '获取二维码失败' });
  }
});

app.get('/api/events/:id/stats', (req, res) => {
  try {
    const event = dataStore.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    const stats = dataStore.getEventStats(req.params.id);
    res.json({
      eventName: event.name,
      total: stats.total,
      checkedIn: stats.checkedIn,
      capacity: event.capacity
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

app.get('/api/events/:id/registrations', (req, res) => {
  try {
    const registrations = dataStore.getRegistrationsByEventId(req.params.id);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: '获取报名列表失败' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-event', (eventId: string) => {
    socket.join(`event-${eventId}`);
    console.log(`Socket ${socket.id} joined event ${eventId}`);
  });

  socket.on('leave-event', (eventId: string) => {
    socket.leave(`event-${eventId}`);
    console.log(`Socket ${socket.id} left event ${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
