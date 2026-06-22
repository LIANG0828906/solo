import express from 'express';
import cors from 'cors';
import expressWs from 'express-ws';
import { v4 as uuidv4 } from 'uuid';
import type { WebSocket } from 'ws';
import { initDatabase, saveScore, getTopScores } from './database';
import {
  createInitialState,
  buildTower,
  upgradeTower,
  startWave,
  gameTick,
  canBuildTower,
  canUpgradeTower,
} from './gameEngine';
import type { GameState, TowerType } from '../shared/types';

const { app, getWss } = expressWs(express());
app.use(cors());
app.use(express.json());

initDatabase();

const games = new Map<string, GameState>();
const clientGameMap = new Map<WebSocket, string>();

interface ClientMessage {
  type: 'build' | 'upgrade' | 'startWave' | 'ping';
  gameId?: string;
  payload?: {
    x?: number;
    y?: number;
    type?: TowerType;
  };
}

function broadcastGameState(gameId: string) {
  const state = games.get(gameId);
  if (!state) return;

  const wss = getWss();
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && clientGameMap.get(client) === gameId) {
      client.send(JSON.stringify({
        type: 'frame',
        state,
      }));
    }
  });
}

function gameLoop(gameId: string) {
  const state = games.get(gameId);
  if (!state) return;

  const newState = gameTick(state);
  games.set(gameId, newState);

  if (newState.phase === 'gameover' && state.phase !== 'gameover') {
    saveScore(newState.score, newState.kills, newState.wave);
  }

  broadcastGameState(gameId);

  if (newState.phase !== 'gameover') {
    setTimeout(() => gameLoop(gameId), 1000 / 30);
  } else {
    setTimeout(() => {
      games.delete(gameId);
    }, 60000);
  }
}

app.post('/api/game/start', (req, res) => {
  const gameId = uuidv4();
  const state = createInitialState(gameId);
  games.set(gameId, state);
  res.json({ gameId, state });
  setTimeout(() => gameLoop(gameId), 100);
});

app.post('/api/game/:gameId/tower/build', (req, res) => {
  const { gameId } = req.params;
  const { x, y, type } = req.body;
  const state = games.get(gameId);

  if (!state) {
    return res.status(404).json({ success: false, reason: '游戏不存在' });
  }

  const check = canBuildTower(state, x, y, type as TowerType);
  if (!check.success) {
    return res.json({ success: false, reason: check.reason, state });
  }

  const newState = buildTower(state, x, y, type as TowerType);
  games.set(gameId, newState);
  broadcastGameState(gameId);

  res.json({ success: true, state: newState });
});

app.post('/api/game/:gameId/tower/upgrade', (req, res) => {
  const { gameId } = req.params;
  const { x, y } = req.body;
  const state = games.get(gameId);

  if (!state) {
    return res.status(404).json({ success: false, reason: '游戏不存在' });
  }

  const check = canUpgradeTower(state, x, y);
  if (!check.success) {
    return res.json({ success: false, reason: check.reason, state });
  }

  const newState = upgradeTower(state, x, y);
  games.set(gameId, newState);
  broadcastGameState(gameId);

  res.json({ success: true, state: newState });
});

app.post('/api/game/:gameId/wave/start', (req, res) => {
  const { gameId } = req.params;
  const state = games.get(gameId);

  if (!state) {
    return res.status(404).json({ success: false, reason: '游戏不存在' });
  }

  if (state.phase !== 'preparation') {
    return res.json({ success: false, reason: '不在准备阶段', state });
  }

  const newState = startWave(state);
  games.set(gameId, newState);
  broadcastGameState(gameId);

  res.json({ success: true, state: newState });
});

app.get('/api/scores', async (req, res) => {
  const scores = getTopScores(10);
  res.json({ scores });
});

app.ws('/api/ws', (ws, req) => {
  const gameId = req.query.gameId as string;

  if (!gameId || !games.has(gameId)) {
    ws.close(1008, '无效的游戏ID');
    return;
  }

  clientGameMap.set(ws, gameId);

  ws.on('message', (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
        return;
      }

      const state = games.get(gameId);
      if (!state) return;

      if (msg.type === 'build' && msg.payload) {
        const { x, y, type } = msg.payload;
        if (x !== undefined && y !== undefined && type) {
          const check = canBuildTower(state, x, y, type);
          if (check.success) {
            const newState = buildTower(state, x, y, type);
            games.set(gameId, newState);
          }
        }
      } else if (msg.type === 'upgrade' && msg.payload) {
        const { x, y } = msg.payload;
        if (x !== undefined && y !== undefined) {
          const check = canUpgradeTower(state, x, y);
          if (check.success) {
            const newState = upgradeTower(state, x, y);
            games.set(gameId, newState);
          }
        }
      } else if (msg.type === 'startWave') {
        if (state.phase === 'preparation') {
          const newState = startWave(state);
          games.set(gameId, newState);
        }
      }
    } catch (err) {
      console.error('WebSocket消息解析错误:', err);
    }
  });

  ws.on('close', () => {
    clientGameMap.delete(ws);
  });

  const currentState = games.get(gameId);
  if (currentState) {
    ws.send(JSON.stringify({
      type: 'frame',
      state: currentState,
    }));
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`魔法塔防游戏服务器运行在端口 ${PORT}`);
});
