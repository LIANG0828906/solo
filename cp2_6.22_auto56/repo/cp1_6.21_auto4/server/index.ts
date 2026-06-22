import express from 'express';
import cors from 'cors';
import {
  getLevel,
  getPlayerState,
  updatePlayerState,
  addTower,
  upgradeTower,
  addEnergy,
  incrementKills,
  resetPlayerState,
} from './dataStore';

const app = express();
const PORT = 3008;

app.use(cors());
app.use(express.json());

app.get('/api/levels/:id', (req, res) => {
  const level = getLevel(req.params.id);
  if (!level) {
    return res.status(404).json({ error: '关卡不存在' });
  }
  res.json(level);
});

app.get('/api/player', (req, res) => {
  res.json(getPlayerState());
});

app.post('/api/player/reset', (req, res) => {
  res.json(resetPlayerState());
});

app.post('/api/player/tower', (req, res) => {
  try {
    const { positionId, type } = req.body;
    if (!positionId || !type) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const state = addTower(positionId, type);
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/player/upgrade', (req, res) => {
  try {
    const { towerId } = req.body;
    if (!towerId) {
      return res.status(400).json({ error: '缺少塔ID' });
    }
    const state = upgradeTower(towerId);
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/player/energy', (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number') {
    return res.status(400).json({ error: '无效的能量值' });
  }
  res.json(addEnergy(amount));
});

app.post('/api/player/kill', (req, res) => {
  res.json(incrementKills());
});

app.put('/api/player', (req, res) => {
  const updates = req.body;
  res.json(updatePlayerState(updates));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
