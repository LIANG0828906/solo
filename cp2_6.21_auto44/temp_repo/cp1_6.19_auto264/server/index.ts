import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import type { Plant, ExchangeRequest, DiaryEntry, User } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('只允许JPG/PNG格式'));
    }
  }
});

const currentUser: User = { id: 'user-1', name: '小明' };
const otherUsers: User[] = [
  { id: 'user-2', name: '李阿姨' },
  { id: 'user-3', name: '王叔叔' },
];

const plants: Plant[] = [
  {
    id: 'p1',
    userId: 'user-2',
    name: '绿萝',
    variety: '黄金葛',
    difficulty: 1,
    habits: '喜半阴，耐干旱，每周浇水1-2次',
    image: undefined,
    status: 'available',
    createdAt: new Date().toISOString(),
    ownerName: '李阿姨'
  },
  {
    id: 'p2',
    userId: 'user-3',
    name: '多肉',
    variety: '玉露',
    difficulty: 2,
    habits: '喜光，少浇水，避免暴晒',
    image: undefined,
    status: 'available',
    createdAt: new Date().toISOString(),
    ownerName: '王叔叔'
  },
  {
    id: 'p3',
    userId: 'user-1',
    name: '薄荷',
    variety: '留兰香薄荷',
    difficulty: 2,
    habits: '喜湿润，阳光充足，勤修剪',
    image: undefined,
    status: 'available',
    createdAt: new Date().toISOString(),
    ownerName: '小明'
  }
];

const exchangeRequests: ExchangeRequest[] = [];
const diaryEntries: DiaryEntry[] = [
  {
    id: 'd1',
    plantId: 'p3',
    userId: 'user-1',
    type: 'watering',
    note: '今天浇了透水，叶子看起来很精神',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    growthValue: 65
  },
  {
    id: 'd2',
    plantId: 'p3',
    userId: 'user-1',
    type: 'fertilizing',
    note: '施了少量液肥',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    growthValue: 72
  }
];

const generateId = () => Math.random().toString(36).substring(2, 11);

app.get('/api/plants', (_req: Request, res: Response) => {
  res.json(plants);
});

app.get('/api/plants/:id', (req: Request, res: Response) => {
  const plant = plants.find(p => p.id === req.params.id);
  if (!plant) return res.status(404).json({ error: '植物不存在' });
  res.json(plant);
});

app.post('/api/plants', upload.single('image'), (req: Request, res: Response) => {
  const { name, variety, difficulty, habits } = req.body;
  let imageData: string | undefined;
  if (req.file) {
    imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }
  const newPlant: Plant = {
    id: generateId(),
    userId: currentUser.id,
    name,
    variety,
    difficulty: parseInt(difficulty),
    habits,
    image: imageData,
    status: 'available',
    createdAt: new Date().toISOString(),
    ownerName: currentUser.name
  };
  plants.push(newPlant);
  res.status(201).json(newPlant);
});

app.put('/api/plants/:id', (req: Request, res: Response) => {
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '植物不存在' });
  plants[index] = { ...plants[index], ...req.body };
  res.json(plants[index]);
});

app.delete('/api/plants/:id', (req: Request, res: Response) => {
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '植物不存在' });
  const [deleted] = plants.splice(index, 1);
  res.json(deleted);
});

app.get('/api/exchanges', (_req: Request, res: Response) => {
  res.json(exchangeRequests);
});

app.post('/api/exchanges', (req: Request, res: Response) => {
  const { fromPlantId, toPlantId } = req.body;
  const fromPlant = plants.find(p => p.id === fromPlantId);
  const toPlant = plants.find(p => p.id === toPlantId);
  if (!fromPlant || !toPlant) return res.status(404).json({ error: '植物不存在' });

  const existingRequest = exchangeRequests.find(
    r => r.fromPlantId === toPlantId && r.toPlantId === fromPlantId && r.status === 'pending'
  );

  if (existingRequest) {
    existingRequest.status = 'exchanged';
    existingRequest.exchangedAt = new Date().toISOString();
    fromPlant.status = 'exchanged';
    toPlant.status = 'exchanged';
    res.json({ request: existingRequest, matched: true });
  } else {
    const newRequest: ExchangeRequest = {
      id: generateId(),
      fromUserId: fromPlant.userId,
      toUserId: toPlant.userId,
      fromPlantId,
      toPlantId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      fromPlantName: fromPlant.name,
      toPlantName: toPlant.name,
      fromOwnerName: fromPlant.ownerName,
      toOwnerName: toPlant.ownerName
    };
    fromPlant.status = 'pending';
    exchangeRequests.push(newRequest);
    res.json({ request: newRequest, matched: false });
  }
});

app.post('/api/exchanges/:id/confirm', (req: Request, res: Response) => {
  const request = exchangeRequests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: '请求不存在' });
  request.status = 'exchanged';
  request.exchangedAt = new Date().toISOString();
  const fromPlant = plants.find(p => p.id === request.fromPlantId);
  const toPlant = plants.find(p => p.id === request.toPlantId);
  if (fromPlant) fromPlant.status = 'exchanged';
  if (toPlant) toPlant.status = 'exchanged';
  res.json(request);
});

app.get('/api/diary', (_req: Request, res: Response) => {
  res.json(diaryEntries);
});

app.get('/api/diary/plant/:plantId', (req: Request, res: Response) => {
  const entries = diaryEntries.filter(d => d.plantId === req.params.plantId);
  res.json(entries);
});

app.post('/api/diary', (req: Request, res: Response) => {
  const { plantId, type, note } = req.body;
  const plantEntries = diaryEntries.filter(d => d.plantId === plantId);
  const lastGrowth = plantEntries.length > 0
    ? Math.max(...plantEntries.map(e => e.growthValue))
    : 10;
  const growthIncrease = type === 'watering' ? 5 : type === 'fertilizing' ? 8 : type === 'pruning' ? 3 : 10;
  const newGrowth = Math.min(100, lastGrowth + growthIncrease + Math.floor(Math.random() * 5));

  const newEntry: DiaryEntry = {
    id: generateId(),
    plantId,
    userId: currentUser.id,
    type,
    note,
    date: new Date().toISOString().split('T')[0],
    growthValue: newGrowth
  };
  diaryEntries.push(newEntry);
  res.status(201).json(newEntry);
});

app.get('/api/user', (_req: Request, res: Response) => {
  res.json(currentUser);
});

app.get('/api/users', (_req: Request, res: Response) => {
  res.json([currentUser, ...otherUsers]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
