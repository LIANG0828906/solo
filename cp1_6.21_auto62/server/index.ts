import express = require('express');
import cors = require('cors');
import {
  createInitialState,
  moveTeam,
  applyEventOption,
  handleEventTimeout,
  canMoveTo,
  GameState,
} from './gameLogic';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let gameState: GameState = createInitialState();

app.get('/api/state', (_req, res) => {
  res.json(gameState);
});

app.post('/api/move', (req, res) => {
  const { x, y } = req.body;

  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: '缺少坐标参数' });
  }

  if (gameState.isEventActive) {
    return res.status(400).json({ error: '事件进行中，无法移动' });
  }

  if (!canMoveTo(gameState, x, y)) {
    return res.status(400).json({ error: '无法移动到该位置' });
  }

  const result = moveTeam(gameState, x, y);
  gameState = result.state;

  res.json({
    success: true,
    state: gameState,
    eventTriggered: result.eventTriggered,
  });
});

app.post('/api/event/choose', (req, res) => {
  const { optionId } = req.body;

  if (!optionId) {
    return res.status(400).json({ error: '缺少选项ID' });
  }

  if (!gameState.isEventActive) {
    return res.status(400).json({ error: '当前没有进行中的事件' });
  }

  gameState = applyEventOption(gameState, optionId);

  res.json({
    success: true,
    state: gameState,
  });
});

app.post('/api/event/timeout', (_req, res) => {
  if (!gameState.isEventActive) {
    return res.status(400).json({ error: '当前没有进行中的事件' });
  }

  gameState = handleEventTimeout(gameState);

  res.json({
    success: true,
    state: gameState,
  });
});

app.post('/api/reset', (_req, res) => {
  gameState = createInitialState();
  res.json({
    success: true,
    state: gameState,
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
