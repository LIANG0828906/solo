import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { matchPlant } from './plantDatabase.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

interface CareLogEntry {
  id: string;
  plantId: string;
  type: '浇水' | '施肥' | '修剪';
  date: string;
  note: string;
}

interface FavoriteEntry {
  id: string;
  plantId: string;
  plantName: string;
  addedAt: string;
}

const careLogs: CareLogEntry[] = [];
const favorites: FavoriteEntry[] = [];

function extractColorsFromBuffer(buffer: Buffer): [number, number, number][] {
  const step = 16;
  const rBuckets: number[] = [];
  const gBuckets: number[] = [];
  const bBuckets: number[] = [];

  for (let i = 0; i < buffer.length - 2; i += step * 3) {
    const r = buffer[i] || 0;
    const g = buffer[i + 1] || 0;
    const b = buffer[i + 2] || 0;
    if (r > 20 || g > 20 || b > 20) {
      rBuckets.push(r);
      gBuckets.push(g);
      bBuckets.push(b);
    }
  }

  if (rBuckets.length === 0) {
    return [[128, 128, 128], [100, 100, 100], [80, 80, 80]];
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const sorted = rBuckets.map((_, i) => ({
    r: rBuckets[i], g: gBuckets[i], b: bBuckets[i],
    brightness: rBuckets[i] * 0.299 + gBuckets[i] * 0.587 + bBuckets[i] * 0.114,
  })).sort((a, b) => a.brightness - b.brightness);

  const third = Math.floor(sorted.length / 3);
  const groups = [
    sorted.slice(0, third),
    sorted.slice(third, third * 2),
    sorted.slice(third * 2),
  ];

  return groups.map(g => {
    if (g.length === 0) return [128, 128, 128] as [number, number, number];
    return [Math.round(avg(g.map(x => x.r))), Math.round(avg(g.map(x => x.g))), Math.round(avg(g.map(x => x.b)))] as [number, number, number];
  });
}

function inferTextureType(mainColors: [number, number, number][]): string {
  const avgGreen = mainColors.reduce((s, c) => s + c[1], 0) / mainColors.length;
  const avgRed = mainColors.reduce((s, c) => s + c[0], 0) / mainColors.length;
  const greenDominance = avgGreen / (avgRed + 1);

  if (greenDominance > 1.3 && avgGreen > 120) return 'trailing-variegated';
  if (greenDominance > 1.2 && avgGreen > 100) return 'heart-shaped-glossy';
  if (avgGreen > 130 && avgRed > 100) return 'striped-upright';
  if (avgGreen > 120) return 'broad-veined';
  if (avgGreen > 100) return 'large-lobed';
  if (avgGreen < 90 && avgRed < 90) return 'spiny-columnar';
  if (avgRed > 140) return 'rosette-fleshy';
  return 'spiky-succulent';
}

app.post('/api/identify', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  const mainColors = extractColorsFromBuffer(req.file.buffer);
  const textureType = inferTextureType(mainColors);
  const plant = matchPlant(mainColors, textureType);

  if (!plant) {
    res.status(404).json({ error: 'No matching plant found' });
    return;
  }

  res.json({
    id: plant.id,
    name: plant.name,
    varieties: plant.varieties,
    careTips: plant.careTips,
    growthCycle: plant.growthCycle,
    mainColors,
    textureType,
  });
});

app.post('/api/logs', (req, res) => {
  const { plantId, type, date, note } = req.body;
  if (!plantId || !type || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const entry: CareLogEntry = {
    id: uuidv4(),
    plantId,
    type,
    date,
    note: note || '',
  };

  careLogs.push(entry);
  res.status(201).json(entry);
});

app.get('/api/logs/:plantId', (req, res) => {
  const { plantId } = req.params;
  const logs = careLogs.filter(l => l.plantId === plantId);
  res.json(logs);
});

app.post('/api/favorites', (req, res) => {
  const { plantId, plantName } = req.body;
  if (!plantId || !plantName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const existingIdx = favorites.findIndex(f => f.plantId === plantId);
  if (existingIdx >= 0) {
    favorites.splice(existingIdx, 1);
    res.json({ favorited: false });
  } else {
    favorites.push({
      id: uuidv4(),
      plantId,
      plantName,
      addedAt: new Date().toISOString(),
    });
    res.json({ favorited: true });
  }
});

app.get('/api/favorites', (_req, res) => {
  res.json(favorites);
});

app.listen(PORT, () => {
  console.log(`Plant API server running on http://localhost:${PORT}`);
});
