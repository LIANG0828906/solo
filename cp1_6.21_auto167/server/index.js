import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3010;
const DATA_FILE = path.join(__dirname, 'data', 'lenses.json');

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

function readLenses() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading lenses data:', err);
    return [];
  }
}

function writeLenses(lenses) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(lenses, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing lenses data:', err);
    return false;
  }
}

app.get('/api/lenses', (_req, res) => {
  const lenses = readLenses();
  res.json(lenses);
});

app.post('/api/lenses', (req, res) => {
  const lenses = readLenses();
  const newLens = {
    id: uuidv4(),
    name: req.body.name || '未命名镜头',
    type: req.body.type || 'video',
    status: 'pending',
    uploadTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    thumbnail: req.body.thumbnail || '',
    format: req.body.format || 'MP4',
    dimensions: req.body.dimensions || '1920x1080',
    duration: req.body.duration || '00:00:00',
    reviewNotes: '',
  };
  lenses.push(newLens);
  writeLenses(lenses);
  res.json(newLens);
});

app.put('/api/lenses/:id', (req, res) => {
  const lenses = readLenses();
  const id = req.params.id;
  const index = lenses.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Lens not found' });
  }

  lenses[index] = { ...lenses[index], ...req.body };
  writeLenses(lenses);
  res.json(lenses[index]);
});

app.delete('/api/lenses/:id', (req, res) => {
  const lenses = readLenses();
  const id = req.params.id;
  const index = lenses.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Lens not found' });
  }

  lenses.splice(index, 1);
  writeLenses(lenses);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[server] LensBoard API running on http://localhost:${PORT}`);
});
