import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { calculateMaterialList } from './calculateList.js';
import type { Room, SaveRecord, CalculateRequest, SaveRequest } from '../src/types.js';

const app = express();
app.use(cors());
app.use(express.json());

const rooms: Room[] = [
  {
    id: 'living',
    name: '客厅',
    width: 4,
    depth: 5,
    height: 2.8,
    furniture: [
      { id: 'sofa', type: 'sofa', position: [0, 0.25, -1.8], size: [2.2, 0.5, 0.9] },
      { id: 'sofa-back', type: 'sofa', position: [0, 0.55, -2.15], size: [2.2, 0.15, 0.2] },
      { id: 'sofa-arm-l', type: 'sofa', position: [-1.05, 0.35, -1.8], size: [0.15, 0.2, 0.9] },
      { id: 'sofa-arm-r', type: 'sofa', position: [1.05, 0.35, -1.8], size: [0.15, 0.2, 0.9] },
      { id: 'coffee-table', type: 'sofa', position: [0, 0.2, -0.7], size: [1.0, 0.05, 0.5] },
    ],
  },
  {
    id: 'bedroom',
    name: '卧室',
    width: 3,
    depth: 4,
    height: 2.8,
    furniture: [
      { id: 'bed-mattress', type: 'bed', position: [0, 0.3, -0.8], size: [1.6, 0.3, 2.0] },
      { id: 'bed-head', type: 'bed', position: [0, 0.6, -1.8], size: [1.6, 0.5, 0.08] },
      { id: 'nightstand', type: 'bed', position: [1.0, 0.25, -1.5], size: [0.45, 0.5, 0.45] },
    ],
  },
  {
    id: 'kitchen',
    name: '厨房',
    width: 2.5,
    depth: 3,
    height: 2.8,
    furniture: [
      { id: 'cabinet-top', type: 'cabinet', position: [0, 1.3, -1.25], size: [2.0, 0.6, 0.35] },
      { id: 'cabinet-bottom', type: 'cabinet', position: [0, 0.45, -1.25], size: [2.0, 0.9, 0.6] },
      { id: 'island', type: 'cabinet', position: [0, 0.4, 0.4], size: [1.2, 0.8, 0.6] },
    ],
  },
];

const savedRecords: SaveRecord[] = [];

app.get('/api/rooms', (_req, res) => {
  res.json(rooms);
});

app.post('/api/calculate', (req: express.Request<{}, {}, CalculateRequest>, res) => {
  try {
    const result = calculateMaterialList(req.body);
    res.json(result);
  } catch {
    res.status(400).json({ error: '计算失败' });
  }
});

app.post('/api/save', (req: express.Request<{}, {}, SaveRequest>, res) => {
  try {
    const id = uuidv4();
    const record: SaveRecord = {
      id,
      roomId: req.body.roomId,
      roomName: req.body.roomName,
      config: req.body.config,
      list: req.body.list,
      savedAt: new Date().toISOString(),
      totalPrice: req.body.list.total,
    };
    savedRecords.push(record);
    res.json({ id });
  } catch {
    res.status(500).json({ error: '保存失败' });
  }
});

app.get('/api/history', (_req, res) => {
  const sorted = [...savedRecords].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
  res.json(sorted);
});

app.get('/api/load/:id', (req, res) => {
  const record = savedRecords.find((r) => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: '未找到记录' });
    return;
  }
  res.json(record);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
