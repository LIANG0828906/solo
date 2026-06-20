import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4001;
const DATA_FILE = path.join(__dirname, '..', 'data', 'buildings.json');

app.use(cors());
app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/building', (req, res) => {
  const data = readData();
  res.json(data);
});

app.get('/api/building/:id', (req, res) => {
  const data = readData();
  const room = data.rooms.find((r) => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.post('/api/building', (req, res) => {
  const data = readData();
  const newRoom = {
    id: uuidv4(),
    name: req.body.name || '新房间',
    x: Number(req.body.x) || 0,
    y: Number(req.body.y) || 0,
    z: Number(req.body.z) || 0,
    width: Number(req.body.width) || 4,
    depth: Number(req.body.depth) || 4,
    height: Number(req.body.height) || 3,
    area: Number(req.body.area) || 16,
    floor: Number(req.body.floor) || 1,
    temperature: Number(req.body.temperature) || 22,
    temperatures: req.body.temperatures || Array.from({ length: 24 }, (_, i) => {
      const base = Number(req.body.temperature) || 22;
      return Math.round(base - 4 + 8 * Math.sin((i - 6) * Math.PI / 12));
    }),
  };
  data.rooms.push(newRoom);
  writeData(data);
  res.status(201).json(newRoom);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
