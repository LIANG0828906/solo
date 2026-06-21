import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const memoryStore = {
  observedStars: [],
  customConnections: [],
  observationLogs: [],
  selectedConstellation: null,
};

const constellations = [
  {
    id: 'orion',
    name: '猎户座',
    stars: ['参宿四', '参宿七', '参宿五', '参宿三', '参宿二', '参宿一', '觜宿一', '猎户星云'],
    connections: [
      ['参宿四', '参宿五'],
      ['参宿五', '参宿七'],
      ['参宿四', '参宿三'],
      ['参宿七', '参宿三'],
      ['参宿三', '参宿二'],
      ['参宿二', '参宿一'],
      ['参宿四', '觜宿一'],
      ['参宿五', '觜宿一'],
    ],
  },
  {
    id: 'bigdipper',
    name: '北斗七星',
    stars: ['天枢', '天璇', '天玑', '天权', '玉衡', '开阳', '摇光'],
    connections: [
      ['天枢', '天璇'],
      ['天璇', '天玑'],
      ['天玑', '天权'],
      ['天权', '玉衡'],
      ['玉衡', '开阳'],
      ['开阳', '摇光'],
      ['天枢', '天权'],
    ],
  },
  {
    id: 'cassiopeia',
    name: '仙后座',
    stars: ['王良四', '王良一', '策', '王良二', '王良三'],
    connections: [
      ['王良四', '王良一'],
      ['王良一', '策'],
      ['策', '王良二'],
      ['王良二', '王良三'],
    ],
  },
  {
    id: 'lyra',
    name: '天琴座',
    stars: ['织女星', '渐台二', '渐台三', '渐台一', '辇道增七'],
    connections: [
      ['织女星', '渐台二'],
      ['织女星', '渐台一'],
      ['渐台二', '渐台三'],
      ['渐台三', '渐台一'],
      ['织女星', '辇道增七'],
    ],
  },
  {
    id: 'cygnus',
    name: '天鹅座',
    stars: ['天津四', '天津一', '天津二', '天津九', '辇道增五'],
    connections: [
      ['天津四', '天津一'],
      ['天津四', '天津二'],
      ['天津一', '天津九'],
      ['天津二', '辇道增五'],
    ],
  },
];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/constellations', (_req, res) => {
  res.json(constellations);
});

app.get('/api/observation/state', (_req, res) => {
  res.json(memoryStore);
});

app.post('/api/observation/state', (req, res) => {
  const { observedStars, customConnections, observationLogs, selectedConstellation } = req.body;
  if (observedStars) memoryStore.observedStars = observedStars;
  if (customConnections) memoryStore.customConnections = customConnections;
  if (observationLogs) memoryStore.observationLogs = observationLogs;
  if (selectedConstellation !== undefined) memoryStore.selectedConstellation = selectedConstellation;
  res.json({ success: true, state: memoryStore });
});

app.post('/api/stars/observe', (req, res) => {
  const { starId, starName, note } = req.body;
  const existing = memoryStore.observedStars.find((s) => s.starId === starId);
  if (existing) {
    existing.note = note || existing.note;
    existing.observedAt = new Date().toISOString();
  } else {
    memoryStore.observedStars.push({
      id: uuidv4(),
      starId,
      starName,
      note: note || '',
      observedAt: new Date().toISOString(),
    });
  }
  res.json({ success: true, observedStars: memoryStore.observedStars });
});

app.delete('/api/stars/observe/:starId', (req, res) => {
  const { starId } = req.params;
  memoryStore.observedStars = memoryStore.observedStars.filter((s) => s.starId !== starId);
  res.json({ success: true, observedStars: memoryStore.observedStars });
});

app.post('/api/connections', (req, res) => {
  const { fromStarId, toStarId, color, note } = req.body;
  const connection = {
    id: uuidv4(),
    fromStarId,
    toStarId,
    color: color || '#7FDBFF',
    note: note || '',
    createdAt: new Date().toISOString(),
  };
  memoryStore.customConnections.push(connection);
  res.json({ success: true, connection });
});

app.get('/api/connections', (_req, res) => {
  res.json(memoryStore.customConnections);
});

app.delete('/api/connections/:id', (req, res) => {
  const { id } = req.params;
  memoryStore.customConnections = memoryStore.customConnections.filter((c) => c.id !== id);
  res.json({ success: true });
});

app.get('/api/logs', (_req, res) => {
  res.json(memoryStore.observationLogs);
});

app.post('/api/logs', (req, res) => {
  const { type, target, note, mood } = req.body;
  const log = {
    id: uuidv4(),
    type,
    target,
    note: note || '',
    mood: mood || '',
    timestamp: new Date().toISOString(),
  };
  memoryStore.observationLogs.unshift(log);
  res.json({ success: true, log });
});

app.put('/api/logs/:id', (req, res) => {
  const { id } = req.params;
  const log = memoryStore.observationLogs.find((l) => l.id === id);
  if (log) {
    if (req.body.note !== undefined) log.note = req.body.note;
    if (req.body.mood !== undefined) log.mood = req.body.mood;
    res.json({ success: true, log });
  } else {
    res.status(404).json({ error: 'Log not found' });
  }
});

app.delete('/api/logs/:id', (req, res) => {
  const { id } = req.params;
  memoryStore.observationLogs = memoryStore.observationLogs.filter((l) => l.id !== id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
