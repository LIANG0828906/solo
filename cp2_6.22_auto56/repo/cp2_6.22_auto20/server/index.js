import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { trips: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/trips', (req, res) => {
  const data = readData();
  res.json(data.trips);
});

app.get('/api/trips/:id', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

app.post('/api/trips', (req, res) => {
  const data = readData();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const trip = { id, ...req.body };
  data.trips.push(trip);
  writeData(data);
  res.status(201).json(trip);
});

app.put('/api/trips/:id', (req, res) => {
  const data = readData();
  const index = data.trips.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Trip not found' });
  const trip = { id: req.params.id, ...req.body };
  data.trips[index] = trip;
  writeData(data);
  res.json(trip);
});

app.delete('/api/trips/:id', (req, res) => {
  const data = readData();
  const index = data.trips.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Trip not found' });
  data.trips.splice(index, 1);
  writeData(data);
  res.status(204).end();
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
