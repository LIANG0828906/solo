import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'events.json');

app.use(cors());
app.use(express.json());

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  votes: string[];
}

interface EventData {
  id: string;
  title: string;
  description: string;
  timeSlots: TimeSlot[];
  createdAt: string;
}

const readData = (): EventData[] => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as EventData[];
  } catch {
    return [];
  }
};

const writeData = (data: EventData[]): void => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

app.get('/api/events', (_req, res) => {
  try {
    const events = readData();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: '读取数据失败' });
  }
});

app.get('/api/events/:id', (req, res) => {
  try {
    const events = readData();
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: '读取数据失败' });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { title, description, timeSlots } = req.body;

    if (!title) {
      return res.status(400).json({ error: '活动标题为必填项' });
    }

    if (!timeSlots || timeSlots.length !== 4) {
      return res.status(400).json({ error: '需要提供4个候选时间' });
    }

    const newEvent: EventData = {
      id: uuidv4(),
      title,
      description: description || '',
      timeSlots: timeSlots.map((slot: Omit<TimeSlot, 'id' | 'votes'>) => ({
        id: uuidv4(),
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        votes: []
      })),
      createdAt: new Date().toISOString()
    };

    const events = readData();
    events.push(newEvent);
    writeData(events);

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: '保存活动失败' });
  }
});

app.put('/api/vote/:eventId/:timeSlotId', (req, res) => {
  try {
    const { eventId, timeSlotId } = req.params;
    const { voterId } = req.body;

    if (!voterId) {
      return res.status(400).json({ error: '缺少投票者ID' });
    }

    const events = readData();
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const event = events[eventIndex];
    let slotFound = false;

    event.timeSlots.forEach(slot => {
      const voterIndex = slot.votes.indexOf(voterId);
      if (slot.id === timeSlotId) {
        slotFound = true;
        if (voterIndex === -1) {
          slot.votes.push(voterId);
        }
      } else {
        if (voterIndex !== -1) {
          slot.votes.splice(voterIndex, 1);
        }
      }
    });

    if (!slotFound) {
      return res.status(404).json({ error: '时间段不存在' });
    }

    events[eventIndex] = event;
    writeData(events);

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: '投票失败' });
  }
});

app.listen(PORT, () => {
  console.log(`EventRipple API 服务运行在 http://localhost:${PORT}`);
});
