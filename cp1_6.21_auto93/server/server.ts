import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { LevelConfig, GameRecord, Position, WaveConfig, EnemyType } from '../src/types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const generatePath = (): Position[] => {
  const path: Position[] = [];
  const startX = 700;
  const endX = 50;
  const midY = 250;
  
  path.push({ x: startX, y: midY });
  path.push({ x: 580, y: midY - 80 });
  path.push({ x: 450, y: midY + 60 });
  path.push({ x: 320, y: midY - 40 });
  path.push({ x: 200, y: midY + 80 });
  path.push({ x: 120, y: midY - 20 });
  path.push({ x: endX, y: midY });
  
  return path;
};

const generateWaves = (totalWaves: number): WaveConfig[] => {
  const waves: WaveConfig[] = [];
  
  for (let i = 1; i <= totalWaves; i++) {
    const enemies: WaveConfig['enemies'] = [];
    const baseCount = 10 + Math.floor(i * 1.5);
    const count = Math.min(baseCount, 20);
    
    const lowCount = Math.max(3, Math.floor(count * (1 - i * 0.1)));
    const mediumCount = Math.floor(count * 0.4);
    const highCount = i >= 3 ? Math.floor(count * 0.2) : 0;
    
    if (lowCount > 0) {
      enemies.push({ type: 'low' as EnemyType, count: lowCount, delay: 800 });
    }
    if (mediumCount > 0) {
      enemies.push({ type: 'medium' as EnemyType, count: mediumCount, delay: 1000 });
    }
    if (highCount > 0) {
      enemies.push({ type: 'high' as EnemyType, count: highCount, delay: 1200 });
    }
    
    waves.push({ waveNumber: i, enemies });
  }
  
  return waves;
};

const defaultLevel: LevelConfig = {
  id: 'level-1',
  name: '星链防线',
  totalWaves: 5,
  waves: generateWaves(5),
  path: generatePath(),
  gridCols: 12,
  gridRows: 8,
  startingLives: 10,
  startingScore: 300
};

let gameRecords: GameRecord[] = [];

app.get('/api/level/:id', (req, res) => {
  const levelId = req.params.id;
  
  if (levelId === 'level-1') {
    res.json(defaultLevel);
  } else {
    res.status(404).json({ error: '关卡不存在' });
  }
});

app.get('/api/levels', (_req, res) => {
  res.json([{ id: defaultLevel.id, name: defaultLevel.name, totalWaves: defaultLevel.totalWaves }]);
});

app.post('/api/records', (req, res) => {
  const { playerName, score, kills, remainingLives, levelId } = req.body;
  
  if (typeof score !== 'number' || typeof kills !== 'number' || typeof remainingLives !== 'number') {
    return res.status(400).json({ error: '无效的战绩数据' });
  }
  
  const record: GameRecord = {
    id: uuidv4(),
    playerName: playerName || '匿名玩家',
    score,
    kills,
    remainingLives,
    levelId: levelId || 'level-1',
    timestamp: Date.now()
  };
  
  gameRecords.push(record);
  
  gameRecords.sort((a, b) => b.score - a.score);
  if (gameRecords.length > 100) {
    gameRecords = gameRecords.slice(0, 100);
  }
  
  res.json({ success: true, record });
});

app.get('/api/records', (_req, res) => {
  res.json(gameRecords);
});

app.listen(PORT, () => {
  console.log(`星链塔防服务器运行在 http://localhost:${PORT}`);
});
