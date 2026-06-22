import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import type { Storyboard, StoryboardCard, ApiResponse } from './types';

const PORT = 3001;
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'storyboards.json');
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

interface DataFile {
  storyboards: Storyboard[];
}

function readData(): DataFile {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DataFile;
    if (!parsed.storyboards) parsed.storyboards = [];
    return parsed;
  } catch {
    return { storyboards: [] };
  }
}

function writeData(data: DataFile): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function createEmptyCards(): StoryboardCard[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `card-${uuidv4()}-${i}`,
    imageUrl: '',
    title: '',
    description: '',
    animation: 'none' as const,
  }));
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/storyboards', (_req, res) => {
  try {
    const data = readData();
    const list = data.storyboards
      .map(({ cards, musicUrl, ...rest }) => ({
        ...rest,
        cover: rest.cover || '',
      }))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    const resp: ApiResponse<typeof list> = { success: true, data: list };
    res.json(resp);
  } catch (err) {
    const resp: ApiResponse<never> = { success: false, error: String(err) };
    res.status(500).json(resp);
  }
});

app.get('/api/storyboards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const sb = data.storyboards.find((s) => s.id === id);
    if (!sb) {
      return res.status(404).json({ success: false, error: '故事板不存在' } as ApiResponse<never>);
    }
    const resp: ApiResponse<Storyboard> = { success: true, data: sb };
    res.json(resp);
  } catch (err) {
    const resp: ApiResponse<never> = { success: false, error: String(err) };
    res.status(500).json(resp);
  }
});

app.post('/api/storyboards', (req, res) => {
  try {
    const { title, cover } = req.body as { title?: string; cover?: string };
    if (!title) {
      return res.status(400).json({ success: false, error: '标题必填' } as ApiResponse<never>);
    }
    const now = new Date().toISOString();
    const newSb: Storyboard = {
      id: uuidv4(),
      title,
      cover: cover || '',
      musicUrl: '',
      cards: createEmptyCards(),
      createdAt: now,
      updatedAt: now,
    };
    const data = readData();
    data.storyboards.push(newSb);
    writeData(data);
    const resp: ApiResponse<Storyboard> = { success: true, data: newSb };
    res.status(201).json(resp);
  } catch (err) {
    const resp: ApiResponse<never> = { success: false, error: String(err) };
    res.status(500).json(resp);
  }
});

app.put('/api/storyboards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<Storyboard>;
    const data = readData();
    const idx = data.storyboards.findIndex((s) => s.id === id);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: '故事板不存在' } as ApiResponse<never>);
    }
    data.storyboards[idx] = {
      ...data.storyboards[idx],
      ...body,
      id: data.storyboards[idx].id,
      createdAt: data.storyboards[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    writeData(data);
    const resp: ApiResponse<Storyboard> = { success: true, data: data.storyboards[idx] };
    res.json(resp);
  } catch (err) {
    const resp: ApiResponse<never> = { success: false, error: String(err) };
    res.status(500).json(resp);
  }
});

app.delete('/api/storyboards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const before = data.storyboards.length;
    data.storyboards = data.storyboards.filter((s) => s.id !== id);
    if (data.storyboards.length === before) {
      return res.status(404).json({ success: false, error: '故事板不存在' } as ApiResponse<never>);
    }
    writeData(data);
    res.json({ success: true, data: {} } as ApiResponse<{}>);
  } catch (err) {
    const resp: ApiResponse<never> = { success: false, error: String(err) };
    res.status(500).json(resp);
  }
});

app.post('/api/storyboards/:id/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未收到文件' } as ApiResponse<never>);
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { imageUrl } } as ApiResponse<{ imageUrl: string }>);
  } catch (err) {
    const resp: ApiResponse<never> = { success: false, error: String(err) };
    res.status(500).json(resp);
  }
});

app.listen(PORT, () => {
  console.log(`[server] Storyboard API running at http://localhost:${PORT}`);
});
