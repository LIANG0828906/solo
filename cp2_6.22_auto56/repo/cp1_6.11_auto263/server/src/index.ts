import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { PostStation, Horse, Courier, Letter, WebSocketMessage } from './models';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const stations: PostStation[] = [
  { id: 1, name: '京城驿站', x: 100, y: 250 },
  { id: 2, name: '金陵驿站', x: 400, y: 100 },
  { id: 3, name: '蜀都驿站', x: 700, y: 350 },
];

const horses: Horse[] = [
  { id: 1, name: '赤兔', speedLevel: 5, maxDistance: 500, stationId: 1, available: true },
  { id: 2, name: '的卢', speedLevel: 4, maxDistance: 450, stationId: 1, available: true },
  { id: 3, name: '绝影', speedLevel: 4, maxDistance: 400, stationId: 2, available: true },
  { id: 4, name: '乌骓', speedLevel: 3, maxDistance: 350, stationId: 2, available: true },
  { id: 5, name: '黄骠', speedLevel: 3, maxDistance: 300, stationId: 3, available: true },
];

const couriers: Courier[] = [
  { id: 1, name: '张三', stamina: 90, totalMileage: 1200, stationId: 1, available: true },
  { id: 2, name: '李四', stamina: 85, totalMileage: 980, stationId: 2, available: true },
  { id: 3, name: '王五', stamina: 95, totalMileage: 1500, stationId: 3, available: true },
];

const deliveredHistory: Letter[] = [];

const generatePath = (fromId: number, toId: number): PostStation[] => {
  const from = stations.find(s => s.id === fromId)!;
  const to = stations.find(s => s.id === toId)!;
  const path: PostStation[] = [from];
  const middle = stations.filter(s => s.id !== fromId && s.id !== toId);
  if (middle.length > 0) {
    const distA = Math.hypot(middle[0].x - from.x, middle[0].y - from.y) + Math.hypot(to.x - middle[0].x, to.y - middle[0].y);
    const directDist = Math.hypot(to.x - from.x, to.y - from.y);
    if (distA < directDist * 1.5) {
      path.push(middle[0]);
    }
  }
  path.push(to);
  return path;
};

const calculateDistance = (p1: PostStation, p2: PostStation): number => {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
};

const calculateTravelTime = (letter: Letter): number => {
  let totalTime = 0;
  for (let i = letter.currentStationIndex; i < letter.path.length - 1; i++) {
    const dist = calculateDistance(letter.path[i], letter.path[i + 1]);
    const horse = horses.find(h => h.id === letter.horseId);
    const speed = horse ? (6 - horse.speedLevel) : 5;
    const interval = letter.type === 'urgent' ? 3000 : 6000;
    const segments = Math.ceil(dist / 50);
    totalTime += segments * interval;
  }
  return totalTime;
};

const updateEstimatedArrival = (letter: Letter) => {
  if (letter.status === 'transit') {
    const travelTime = calculateTravelTime(letter);
    letter.estimatedArrival = new Date(Date.now() + travelTime);
  }
};

let nextLetterId = 1;

const createInitialLetter = (
  sender: string,
  receiver: string,
  fromStationId: number,
  toStationId: number,
  type: 'urgent' | 'normal'
): Letter => {
  const path = generatePath(fromStationId, toStationId);
  return {
    id: nextLetterId++,
    sender,
    receiver,
    fromStationId,
    toStationId,
    type,
    status: 'pending',
    currentStationIndex: 0,
    path,
    createdAt: new Date(),
  };
};

const letters: Letter[] = [
  createInitialLetter('李员外', '张大人', 1, 3, 'urgent'),
  createInitialLetter('王老板', '赵管家', 2, 1, 'normal'),
  createInitialLetter('陈书生', '刘县令', 1, 2, 'normal'),
  createInitialLetter('孙将军', '周丞相', 3, 1, 'urgent'),
  createInitialLetter('吴商人', '郑掌柜', 2, 3, 'normal'),
];

const broadcast = (message: WebSocketMessage) => {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', (ws) => {
  const initMessage: WebSocketMessage = {
    type: 'init',
    payload: {
      stations,
      horses,
      couriers,
      letters,
      history: deliveredHistory,
    },
  };
  ws.send(JSON.stringify(initMessage));
});

app.get('/api/stations', (req, res) => {
  res.json(stations);
});

app.get('/api/horses', (req, res) => {
  res.json(horses);
});

app.get('/api/couriers', (req, res) => {
  res.json(couriers);
});

app.get('/api/letters', (req, res) => {
  res.json(letters);
});

app.get('/api/history', (req, res) => {
  res.json(deliveredHistory);
});

app.post('/api/letters', (req, res) => {
  const { sender, receiver, fromStationId, toStationId, type } = req.body;

  if (!sender || !receiver || !fromStationId || !toStationId || !type) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  if (!stations.find(s => s.id === fromStationId) || !stations.find(s => s.id === toStationId)) {
    return res.status(400).json({ error: '驿站不存在' });
  }

  if (type !== 'urgent' && type !== 'normal') {
    return res.status(400).json({ error: '信件类型无效' });
  }

  const letter = createInitialLetter(sender, receiver, fromStationId, toStationId, type);
  letters.push(letter);

  broadcast({
    type: 'letter_created',
    payload: letter,
  });

  res.status(201).json(letter);
});

app.post('/api/letters/:id/assign', (req, res) => {
  const id = parseInt(req.params.id);
  const letter = letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ error: '信件不存在' });
  }

  if (letter.status !== 'pending') {
    return res.status(400).json({ error: '信件状态不允许分配' });
  }

  const startStationId = letter.path[letter.currentStationIndex].id;
  const availableHorse = horses.find(h => h.stationId === startStationId && h.available);
  const availableCourier = couriers.find(c => c.stationId === startStationId && c.available);

  if (!availableHorse || !availableCourier) {
    return res.status(400).json({ error: '当前驿站没有可用的马匹或信差' });
  }

  availableHorse.available = false;
  availableCourier.available = false;

  letter.horseId = availableHorse.id;
  letter.courierId = availableCourier.id;
  letter.status = 'transit';
  letter.dispatchedAt = new Date();
  updateEstimatedArrival(letter);

  broadcast({
    type: 'letter_update',
    payload: letter,
  });

  res.json(letter);
});

const processLetterStep = (letter: Letter) => {
  const nextIndex = letter.currentStationIndex + 1;
  if (nextIndex >= letter.path.length) {
    letter.status = 'delivered';
    letter.deliveredAt = new Date();
    letter.estimatedArrival = undefined;

    const horse = horses.find(h => h.id === letter.horseId);
    const courier = couriers.find(c => c.id === letter.courierId);
    if (horse) {
      horse.stationId = letter.toStationId;
      horse.available = true;
    }
    if (courier) {
      courier.stationId = letter.toStationId;
      courier.available = true;
      const totalDist = letter.path.reduce((sum, s, i) => {
        if (i === 0) return 0;
        return sum + calculateDistance(letter.path[i - 1], s);
      }, 0);
      courier.totalMileage += Math.round(totalDist);
    }

    deliveredHistory.push({ ...letter });

    broadcast({
      type: 'letter_delivered',
      payload: letter,
    });

    const idx = letters.indexOf(letter);
    if (idx > -1) letters.splice(idx, 1);
    return;
  }

  letter.currentStationIndex = nextIndex;
  updateEstimatedArrival(letter);

  const currentStation = letter.path[nextIndex];
  const prevStation = letter.path[nextIndex - 1];
  const segmentDist = calculateDistance(prevStation, currentStation);

  const horse = horses.find(h => h.id === letter.horseId);
  const courier = couriers.find(c => c.id === letter.courierId);

  if (nextIndex < letter.path.length - 1) {
    if (horse) horse.stationId = currentStation.id;
    if (courier) {
      courier.stationId = currentStation.id;
      courier.totalMileage += Math.round(segmentDist);
      courier.stamina = Math.max(10, courier.stamina - 5);
    }
  }

  broadcast({
    type: 'letter_update',
    payload: letter,
  });
};

const urgentTimer = setInterval(() => {
  [...letters].forEach(letter => {
    if (letter.status === 'transit' && letter.type === 'urgent') {
      processLetterStep(letter);
    }
  });
}, 3000);

const normalTimer = setInterval(() => {
  [...letters].forEach(letter => {
    if (letter.status === 'transit' && letter.type === 'normal') {
      processLetterStep(letter);
    }
  });
}, 6000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`驿传系统后端服务已启动: http://localhost:${PORT}`);
  console.log(`WebSocket 服务已就绪`);
});
