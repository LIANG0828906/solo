import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { CoffeeBean, BrewRecord } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const readJsonFile = <T>(filename: string): T[] => {
  const filePath = path.join(dataDir, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
};

const writeJsonFile = <T>(filename: string, data: T[]): void => {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const calculateOverallScore = (flavor: BrewRecord['flavor']): number => {
  const values = Object.values(flavor) as number[];
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
};

app.get('/api/beans', (_req, res) => {
  const beans = readJsonFile<CoffeeBean>('beans.json');
  res.json(beans);
});

app.get('/api/beans/:id', (req, res) => {
  const beans = readJsonFile<CoffeeBean>('beans.json');
  const bean = beans.find((b) => b.id === req.params.id);
  if (!bean) return res.status(404).json({ error: '咖啡豆不存在' });
  res.json(bean);
});

app.post('/api/beans', (req, res) => {
  const beans = readJsonFile<CoffeeBean>('beans.json');
  const newBean: CoffeeBean = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    userId: 'user-1',
  };
  beans.push(newBean);
  writeJsonFile('beans.json', beans);
  res.status(201).json(newBean);
});

app.put('/api/beans/:id', (req, res) => {
  const beans = readJsonFile<CoffeeBean>('beans.json');
  const index = beans.findIndex((b) => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '咖啡豆不存在' });
  beans[index] = { ...beans[index], ...req.body };
  writeJsonFile('beans.json', beans);
  res.json(beans[index]);
});

app.delete('/api/beans/:id', (req, res) => {
  const beans = readJsonFile<CoffeeBean>('beans.json');
  const filtered = beans.filter((b) => b.id !== req.params.id);
  if (filtered.length === beans.length)
    return res.status(404).json({ error: '咖啡豆不存在' });
  writeJsonFile('beans.json', filtered);
  res.json({ success: true });
});

app.get('/api/brews', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const { beanId } = req.query;
  let result = brews;
  if (beanId) {
    result = brews.filter((b) => b.beanId === beanId);
  }
  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(result);
});

app.get('/api/brews/:id', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const brew = brews.find((b) => b.id === req.params.id);
  if (!brew) return res.status(404).json({ error: '记录不存在' });
  res.json(brew);
});

app.post('/api/brews', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const overallScore = calculateOverallScore(req.body.flavor);
  const newBrew: BrewRecord = {
    id: uuidv4(),
    ...req.body,
    overallScore,
    likes: 0,
    isPublic: req.body.isPublic ?? false,
    createdAt: new Date().toISOString(),
    userId: 'user-1',
  };
  brews.push(newBrew);
  writeJsonFile('brews.json', brews);
  res.status(201).json(newBrew);
});

app.put('/api/brews/:id', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const index = brews.findIndex((b) => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '记录不存在' });
  const updated = { ...brews[index], ...req.body };
  if (req.body.flavor) {
    updated.overallScore = calculateOverallScore(req.body.flavor);
  }
  brews[index] = updated;
  writeJsonFile('brews.json', brews);
  res.json(brews[index]);
});

app.delete('/api/brews/:id', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const filtered = brews.filter((b) => b.id !== req.params.id);
  if (filtered.length === brews.length)
    return res.status(404).json({ error: '记录不存在' });
  writeJsonFile('brews.json', filtered);
  res.json({ success: true });
});

app.post('/api/brews/:id/like', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const index = brews.findIndex((b) => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '记录不存在' });
  brews[index].likes += 1;
  writeJsonFile('brews.json', brews);
  res.json({ likes: brews[index].likes });
});

app.get('/api/community/brews', (req, res) => {
  const brews = readJsonFile<BrewRecord>('brews.json');
  const publicBrews = brews.filter((b) => b.isPublic);
  const sortBy = (req.query.sortBy as string) || 'likes';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (sortBy === 'likes') {
    publicBrews.sort((a, b) => b.likes - a.likes);
  } else {
    publicBrews.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const start = (page - 1) * limit;
  const paginated = publicBrews.slice(start, start + limit);

  res.json({
    data: paginated,
    total: publicBrews.length,
    page,
    limit,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
