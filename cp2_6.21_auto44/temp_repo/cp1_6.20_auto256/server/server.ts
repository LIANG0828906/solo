import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

type TreasureType = 'gem' | 'coin' | 'chest';

interface Treasure {
  id: string;
  type: TreasureType;
  lat: number;
  lng: number;
  collected: boolean;
}

interface Player {
  id: string;
  name: string;
  score: number;
}

const SCORE_MAP: Record<TreasureType, number> = {
  gem: 10,
  coin: 5,
  chest: 15,
};

const CENTER_LAT = 31.2304;
const CENTER_LNG = 121.4737;
const RANGE = 0.02;

let treasures: Treasure[] = [];
let players: Player[] = [];
let gameRound = 1;
let countdownActive = false;
let countdownEndTime = 0;

function generateTreasures(): Treasure[] {
  const types: TreasureType[] = ['gem', 'coin', 'chest'];
  const newTreasures: Treasure[] = [];
  
  for (let i = 0; i < 10; i++) {
    newTreasures.push({
      id: uuidv4(),
      type: types[Math.floor(Math.random() * types.length)],
      lat: CENTER_LAT + (Math.random() - 0.5) * RANGE * 2,
      lng: CENTER_LNG + (Math.random() - 0.5) * RANGE * 2,
      collected: false,
    });
  }
  
  return newTreasures;
}

treasures = generateTreasures();

for (let i = 0; i < 5; i++) {
  players.push({
    id: uuidv4(),
    name: `玩家${i + 1}`,
    score: Math.floor(Math.random() * 100),
  });
}

app.get('/api/treasures', (req, res) => {
  res.json({
    treasures: treasures.map(t => ({
      id: t.id,
      type: t.type,
      lat: t.lat,
      lng: t.lng,
      collected: t.collected,
    })),
    gameRound,
    countdownActive,
    countdownEndTime,
    centerLat: CENTER_LAT,
    centerLng: CENTER_LNG,
  });
});

app.post('/api/claim', (req, res) => {
  const { treasureId, playerId, playerName } = req.body;
  
  if (!treasureId || !playerId) {
    return res.status(400).json({ error: '缺少参数' });
  }
  
  const treasure = treasures.find(t => t.id === treasureId);
  
  if (!treasure) {
    return res.status(404).json({ error: '宝藏不存在' });
  }
  
  if (treasure.collected) {
    return res.status(400).json({ error: '宝藏已被拾取' });
  }
  
  treasure.collected = true;
  
  let player = players.find(p => p.id === playerId);
  if (!player) {
    player = {
      id: playerId,
      name: playerName || `玩家${Math.floor(Math.random() * 1000)}`,
      score: 0,
    };
    players.push(player);
  } else if (playerName && player.name !== playerName) {
    player.name = playerName;
  }
  
  const points = SCORE_MAP[treasure.type];
  player.score += points;
  
  const remainingTreasures = treasures.filter(t => !t.collected);
  if (remainingTreasures.length === 0 && !countdownActive) {
    countdownActive = true;
    countdownEndTime = Date.now() + 60000;
    
    setTimeout(() => {
      treasures = generateTreasures();
      gameRound++;
      countdownActive = false;
      countdownEndTime = 0;
    }, 60000);
  }
  
  res.json({
    success: true,
    points,
    totalScore: player.score,
    remainingCount: remainingTreasures.length - 1,
    countdownActive,
    countdownEndTime,
  });
});

app.get('/api/leaderboard', (req, res) => {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 10);
  res.json({ leaderboard: sorted });
});

app.post('/api/player', (req, res) => {
  const { playerId, playerName } = req.body;
  
  let player = players.find(p => p.id === playerId);
  if (!player) {
    player = {
      id: playerId || uuidv4(),
      name: playerName || `玩家${Math.floor(Math.random() * 1000)}`,
      score: 0,
    };
    players.push(player);
  }
  
  res.json(player);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
