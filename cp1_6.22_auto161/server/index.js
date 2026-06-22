import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const levels = [
  {
    id: 1,
    playerStart: { x: 100, y: 300 },
    obstacles: [
      {
        id: 'obs-1-1',
        type: 'rect',
        x: 400,
        y: 200,
        width: 40,
        height: 200,
      },
    ],
    buttons: [
      {
        id: 'btn-1-1',
        x: 700,
        y: 300,
        radius: 15,
        triggerDoorId: 'door-1-1',
      },
    ],
    doors: [
      {
        id: 'door-1-1',
        x: 850,
        y: 200,
        width: 30,
        height: 200,
      },
    ],
    exit: { x: 920, y: 250, width: 50, height: 100 },
  },
  {
    id: 2,
    playerStart: { x: 80, y: 450 },
    obstacles: [
      {
        id: 'obs-2-1',
        type: 'rect',
        x: 250,
        y: 100,
        width: 30,
        height: 180,
      },
      {
        id: 'obs-2-2',
        type: 'triangle',
        x: 500,
        y: 300,
        points: [0, 0, 60, 0, 30, 80],
      },
      {
        id: 'obs-2-3',
        type: 'rect',
        x: 650,
        y: 400,
        width: 150,
        height: 30,
      },
    ],
    buttons: [
      {
        id: 'btn-2-1',
        x: 350,
        y: 180,
        radius: 15,
        triggerDoorId: 'door-2-1',
      },
      {
        id: 'btn-2-2',
        x: 800,
        y: 300,
        radius: 15,
        triggerPlatformId: 'plat-2-1',
      },
    ],
    doors: [
      {
        id: 'door-2-1',
        x: 450,
        y: 450,
        width: 30,
        height: 120,
      },
    ],
    platforms: [
      {
        id: 'plat-2-1',
        x: 850,
        y: 520,
        width: 100,
        height: 20,
        targetY: 380,
      },
    ],
    exit: { x: 920, y: 360, width: 50, height: 100 },
  },
  {
    id: 3,
    playerStart: { x: 60, y: 500 },
    obstacles: [
      {
        id: 'obs-3-1',
        type: 'polygon',
        x: 200,
        y: 150,
        points: [0, 0, 80, -20, 100, 40, 60, 80, 0, 60],
      },
      {
        id: 'obs-3-2',
        type: 'rect',
        x: 380,
        y: 250,
        width: 30,
        height: 160,
      },
      {
        id: 'obs-3-3',
        type: 'triangle',
        x: 520,
        y: 120,
        points: [0, 0, 70, 0, 35, 100],
      },
      {
        id: 'obs-3-4',
        type: 'polygon',
        x: 650,
        y: 380,
        points: [0, 0, 90, 10, 100, 60, 50, 90, -10, 50],
      },
      {
        id: 'obs-3-5',
        type: 'rect',
        x: 800,
        y: 180,
        width: 40,
        height: 140,
      },
    ],
    buttons: [
      {
        id: 'btn-3-1',
        x: 300,
        y: 400,
        radius: 15,
        triggerDoorId: 'door-3-1',
      },
      {
        id: 'btn-3-2',
        x: 600,
        y: 260,
        radius: 15,
        triggerDoorId: 'door-3-2',
      },
      {
        id: 'btn-3-3',
        x: 880,
        y: 450,
        radius: 15,
        triggerPlatformId: 'plat-3-1',
      },
    ],
    doors: [
      {
        id: 'door-3-1',
        x: 450,
        y: 450,
        width: 25,
        height: 100,
      },
      {
        id: 'door-3-2',
        x: 750,
        y: 350,
        width: 25,
        height: 120,
      },
    ],
    platforms: [
      {
        id: 'plat-3-1',
        x: 900,
        y: 530,
        width: 80,
        height: 15,
        targetY: 400,
      },
    ],
    exit: { x: 940, y: 410, width: 40, height: 80 },
  },
];

const records = [];

app.get('/api/levels', (_req, res) => {
  res.json(levels);
});

app.post('/api/records', (req, res) => {
  const { playerId, levelId, duration } = req.body;

  if (!playerId || !levelId || duration == null) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }

  const record = {
    playerId,
    levelId,
    duration,
    timestamp: Date.now(),
  };
  records.push(record);

  const levelRecords = records.filter((r) => r.levelId === levelId);
  const fastestTime = levelRecords.length > 0
    ? Math.min(...levelRecords.map((r) => r.duration))
    : duration;

  res.json({
    success: true,
    fastestTime,
  });
});

app.listen(PORT, () => {
  console.log(`光影解谜游戏后端服务已启动: http://localhost:${PORT}`);
});
