import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { TechDebtItem } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const items = new Map<string, TechDebtItem>();

app.get('/api/items', (_req, res) => {
  res.json(Array.from(items.values()));
});

app.post('/api/item', (req, res) => {
  const { title, description, severity, estimatedHours, codeReferences } = req.body;
  const now = Date.now();
  const id = uuidv4();

  const newItem: TechDebtItem = {
    id,
    title,
    description,
    severity,
    estimatedHours,
    status: 'todo',
    codeReferences: codeReferences || [],
    createdAt: now,
    updatedAt: now,
  };

  items.set(id, newItem);
  res.status(201).json(newItem);
});

app.put('/api/item/:id', (req, res) => {
  const { id } = req.params;
  const existingItem = items.get(id);

  if (!existingItem) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const updatedItem: TechDebtItem = {
    ...existingItem,
    ...req.body,
    id,
    updatedAt: Date.now(),
  };

  items.set(id, updatedItem);
  res.json(updatedItem);
});

app.delete('/api/item/:id', (req, res) => {
  const { id } = req.params;

  if (!items.has(id)) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  items.delete(id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log('Tech Debt API server running on port 3001');
});
