import express from 'express';
import cors from 'cors';

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

interface GameSave {
  timestamp: number;
  starField: any;
  ships: any;
  buildings: any;
  resources: any;
}

let gameSaves: Map<string, GameSave> = new Map();

app.post('/save', (req, res) => {
  const { id, data } = req.body;
  
  if (!id || !data) {
    return res.status(400).json({ error: 'Invalid save data' });
  }

  gameSaves.set(id, {
    timestamp: Date.now(),
    ...data
  });

  res.json({ success: true, message: '保存成功' });
});

app.get('/load', (req, res) => {
  const id = typeof req.query.id === 'string' ? req.query.id : 'default';
  
  const save = gameSaves.get(id);
  
  if (!save) {
    return res.status(404).json({ error: '存档不存在' });
  }

  res.json({ success: true, data: save });
});

app.get('/saves', (_req, res) => {
  const savesList = Array.from(gameSaves.entries()).map(([id, save]) => ({
    id,
    timestamp: save.timestamp
  }));
  res.json({ saves: savesList });
});

app.delete('/save/:id', (req, res) => {
  const { id } = req.params;
  
  if (!gameSaves.has(id)) {
    return res.status(404).json({ error: '存档不存在' });
  }

  gameSaves.delete(id);
  res.json({ success: true, message: '删除成功' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Save server running on port ${port}`);
});

export default app;
