import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

enum LayoutMode {
  GRID = 'grid',
  TIMELINE = 'timeline',
  RANDOM = 'random'
}

interface Card {
  id: string;
  title: string;
  content: string;
  photoUrl: string | null;
  position: { x: number; y: number; z: number };
  wallIndex: number;
  createdAt: string;
  color: string;
}

interface CreateCardPayload {
  title: string;
  content: string;
  photoBase64?: string;
  position?: { x: number; y: number; z: number };
  wallIndex?: number;
  color?: string;
}

const PALETTE = [
  '#0a4c6b',
  '#0d5f8a',
  '#1077a3',
  '#1589b8',
  '#1a9ccf',
  '#206e8e',
  '#185a7d',
  '#12486c',
  '#0c3660',
  '#082850'
];

const app = express();
const PORT = 3001;

const cards: Card[] = [];
const base64Store: Map<string, string> = new Map();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

function calculatePosition(wallIndex: number, index: number): { x: number; y: number; z: number } {
  const z = wallIndex % 2 === 0 ? -3 : 3;
  const x = index * 2;
  const y = 1.5;
  return { x, y, z };
}

app.get('/api/cards', (_req, res) => {
  res.json(cards);
});

app.post('/api/cards', (req, res) => {
  const payload: CreateCardPayload = req.body;
  const id = uuidv4();
  const wallIndex = payload.wallIndex ?? Math.floor(Math.random() * 2);
  const sameWallCards = cards.filter(c => c.wallIndex === wallIndex);
  const position = payload.position ?? calculatePosition(wallIndex, sameWallCards.length);
  const color = payload.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)];

  let photoUrl: string | null = null;
  if (payload.photoBase64) {
    base64Store.set(id, payload.photoBase64);
    photoUrl = `/uploads/${id}.txt`;
    const filePath = path.join(uploadsDir, `${id}.txt`);
    fs.writeFileSync(filePath, payload.photoBase64);
  }

  const card: Card = {
    id,
    title: payload.title,
    content: payload.content,
    photoUrl,
    position,
    wallIndex,
    createdAt: new Date().toISOString(),
    color
  };

  cards.push(card);
  res.status(201).json(card);
});

app.put('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  const updates = req.body as Partial<Card>;
  cards[index] = { ...cards[index], ...updates, id };

  res.json(cards[index]);
});

app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  cards.splice(index, 1);
  base64Store.delete(id);

  const filePath = path.join(uploadsDir, `${id}.txt`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ success: true });
});

app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Memory Corridor server running on http://localhost:${PORT}`);
});
