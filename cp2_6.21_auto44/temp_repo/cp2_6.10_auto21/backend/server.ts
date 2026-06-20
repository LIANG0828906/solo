import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const eventsFilePath = path.resolve(__dirname, '../data/events.json');

type EventType = 'dock' | 'unload' | 'lock' | 'collision' | 'sink';

interface EventLog {
  id: string;
  timestamp: string;
  type: EventType;
  shipId: string;
  description: string;
  impact: number;
  loss: number;
}

function readEvents(): EventLog[] {
  if (!fs.existsSync(eventsFilePath)) {
    return [];
  }
  const data = fs.readFileSync(eventsFilePath, 'utf-8');
  return JSON.parse(data);
}

function writeEvents(events: EventLog[]): void {
  fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf-8');
}

app.get('/events', (req, res) => {
  const events = readEvents();
  res.json(events);
});

app.post('/events', (req, res) => {
  const { type, shipId, description, impact, loss } = req.body;

  const newEvent: EventLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    shipId,
    description,
    impact,
    loss,
  };

  const events = readEvents();
  events.push(newEvent);
  writeEvents(events);

  res.json(newEvent);
});

app.delete('/events', (req, res) => {
  writeEvents([]);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
