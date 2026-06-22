import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  EventData,
  ParticipantData,
  getEvents,
  saveEvents,
  getParticipants,
  saveParticipants,
} from './data';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function generateCheckInCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post('/api/events', async (req, res) => {
  try {
    const { name, date, time, location, maxCapacity, roleLimits } = req.body;

    if (!name || !date || !time || !location || !maxCapacity || !roleLimits) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    const newEvent: EventData = {
      id: uuidv4(),
      name,
      date,
      time,
      location,
      maxCapacity,
      roleLimits,
      createdAt: new Date().toISOString(),
    };

    const events = await getEvents();
    events.push(newEvent);
    await saveEvents(events);

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await getEvents();
    res.json(events);
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const events = await getEvents();
    const event = events.find((e) => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }

    res.json(event);
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, role } = req.body;

    if (!name || !contact || !role) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    const events = await getEvents();
    const event = events.find((e) => e.id === id);

    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const participants = await getParticipants();
    const eventParticipants = participants.filter((p) => p.eventId === id);

    const totalParticipants = eventParticipants.length;
    if (totalParticipants >= event.maxCapacity) {
      return res.status(400).json({ error: '活动名额已满' });
    }

    const roleLimit = event.roleLimits[role] || 0;
    const roleParticipants = eventParticipants.filter((p) => p.role === role);
    if (roleParticipants.length >= roleLimit) {
      return res.status(400).json({ error: `${role}角色名额已满` });
    }

    const newParticipant: ParticipantData = {
      id: uuidv4(),
      eventId: id,
      name,
      contact,
      role,
      checkInCode: generateCheckInCode(),
      checkedIn: false,
      checkInTime: null,
      registeredAt: new Date().toISOString(),
    };

    participants.push(newParticipant);
    await saveParticipants(participants);

    res.status(201).json(newParticipant);
  } catch (error) {
    console.error('报名失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/events/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const participants = await getParticipants();
    const eventParticipants = participants.filter((p) => p.eventId === id);
    res.json(eventParticipants);
  } catch (error) {
    console.error('获取参与者列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.put('/api/events/:id/checkin', async (req, res) => {
  try {
    const { participantId, checkInCode } = req.body;

    const participants = await getParticipants();
    let participantIndex = -1;

    if (participantId) {
      participantIndex = participants.findIndex(
        (p) => p.id === participantId && p.eventId === req.params.id
      );
    } else if (checkInCode) {
      participantIndex = participants.findIndex(
        (p) => p.checkInCode === checkInCode && p.eventId === req.params.id
      );
    }

    if (participantIndex === -1) {
      return res.status(404).json({ error: '参与者不存在或签到码无效' });
    }

    participants[participantIndex].checkedIn = true;
    participants[participantIndex].checkInTime = new Date().toISOString();
    await saveParticipants(participants);

    res.json(participants[participantIndex]);
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/events/:id/export', async (req, res) => {
  try {
    const { id } = req.params;

    const events = await getEvents();
    const event = events.find((e) => e.id === id);

    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const participants = await getParticipants();
    const eventParticipants = participants.filter((p) => p.eventId === id);

    const headers = ['姓名', '联系方式', '角色', '签到状态', '报名时间', '签到时间'];
    const rows = eventParticipants.map((p) => [
      p.name,
      p.contact,
      p.role,
      p.checkedIn ? '已签到' : '未签到',
      new Date(p.registeredAt).toLocaleString('zh-CN'),
      p.checkInTime ? new Date(p.checkInTime).toLocaleString('zh-CN') : '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(event.name)}_参与者名单.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error('导出CSV失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
