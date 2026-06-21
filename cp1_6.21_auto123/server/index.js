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
const DATA_FILE = path.join(__dirname, 'data', 'presets.json');

app.use(cors());
app.use(express.json());

function readPresets() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writePresets(presets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(presets, null, 2), 'utf-8');
}

app.get('/api/presets', (req, res) => {
  const presets = readPresets();
  res.json(presets);
});

app.post('/api/presets', (req, res) => {
  const presets = readPresets();
  const newPreset = {
    id: uuidv4(),
    name: req.body.name || '未命名预设',
    params: req.body.params || {},
    createdAt: new Date().toISOString(),
  };
  presets.push(newPreset);
  writePresets(presets);
  res.status(201).json(newPreset);
});

app.put('/api/presets/:id', (req, res) => {
  const presets = readPresets();
  const idx = presets.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '预设未找到' });
  }
  presets[idx] = {
    ...presets[idx],
    name: req.body.name ?? presets[idx].name,
    params: req.body.params ?? presets[idx].params,
  };
  writePresets(presets);
  res.json(presets[idx]);
});

app.delete('/api/presets/:id', (req, res) => {
  const presets = readPresets();
  const idx = presets.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '预设未找到' });
  }
  const deleted = presets.splice(idx, 1)[0];
  writePresets(presets);
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`[Flow Loom] 后端服务器运行于 http://localhost:${PORT}`);
});
