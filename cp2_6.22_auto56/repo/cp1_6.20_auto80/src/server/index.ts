import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Log, Route } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

const app = express();
const PORT = 27846;

app.use(cors());
app.use(bodyParser.json());

function readLogs(): Log[] {
  const filePath = path.join(DATA_DIR, 'logs.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeLogs(logs: Log[]) {
  const filePath = path.join(DATA_DIR, 'logs.json');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
}

function readRoutes(): Route[] {
  const filePath = path.join(DATA_DIR, 'routes.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeRoutes(routes: Route[]) {
  const filePath = path.join(DATA_DIR, 'routes.json');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(routes, null, 2));
}

app.get('/api/logs', (_req, res) => {
  const logs = readLogs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(logs);
});

app.get('/api/logs/search', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  const logs = readLogs()
    .filter(log =>
      log.name.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(logs);
});

app.get('/api/logs/:id', (req, res) => {
  const logs = readLogs();
  const log = logs.find(l => l.id === req.params.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  res.json(log);
});

app.post('/api/logs', (req, res) => {
  const logs = readLogs();
  const now = new Date().toISOString();
  const newLog: Log = {
    id: uuidv4(),
    name: req.body.name,
    date: req.body.date,
    description: req.body.description,
    photos: req.body.photos || [],
    lat: req.body.lat,
    lng: req.body.lng,
    createdAt: now,
    updatedAt: now,
  };
  logs.push(newLog);
  writeLogs(logs);
  res.status(201).json(newLog);
});

app.put('/api/logs/:id', (req, res) => {
  const logs = readLogs();
  const idx = logs.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Log not found' });
  logs[idx] = {
    ...logs[idx],
    ...req.body,
    id: logs[idx].id,
    createdAt: logs[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  writeLogs(logs);
  res.json(logs[idx]);
});

app.delete('/api/logs/:id', (req, res) => {
  let logs = readLogs();
  const initialLen = logs.length;
  logs = logs.filter(l => l.id !== req.params.id);
  if (logs.length === initialLen) return res.status(404).json({ error: 'Log not found' });
  writeLogs(logs);
  res.status(204).send();
});

app.get('/api/routes', (_req, res) => {
  const routes = readRoutes().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(routes);
});

app.get('/api/routes/:id', (req, res) => {
  const routes = readRoutes();
  const route = routes.find(r => r.id === req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  res.json(route);
});

app.post('/api/routes', (req, res) => {
  const routes = readRoutes();
  const newRoute: Route = {
    id: uuidv4(),
    name: req.body.name || '我的旅行路线',
    logIds: req.body.logIds,
    createdAt: new Date().toISOString(),
  };
  routes.push(newRoute);
  writeRoutes(routes);
  res.status(201).json(newRoute);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
