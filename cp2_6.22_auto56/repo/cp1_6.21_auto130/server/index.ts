import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const pokemonList = [
  {
    id: 'charmander',
    name: '小火龙',
    maxHp: 100,
    attack: 13,
    defense: 9,
    color: '#FF6B6B',
    skills: [
      { name: '火焰喷射', hitRate: 0.85, critRate: 0.12, multiplier: 1.3 },
      { name: '火花', hitRate: 0.95, critRate: 0.05, multiplier: 1.0 },
    ],
  },
  {
    id: 'bulbasaur',
    name: '妙蛙种子',
    maxHp: 110,
    attack: 11,
    defense: 11,
    color: '#4CAF50',
    skills: [
      { name: '藤鞭', hitRate: 0.90, critRate: 0.08, multiplier: 1.2 },
      { name: '飞叶快刀', hitRate: 0.80, critRate: 0.15, multiplier: 1.5 },
    ],
  },
  {
    id: 'squirtle',
    name: '杰尼龟',
    maxHp: 120,
    attack: 10,
    defense: 12,
    color: '#42A5F5',
    skills: [
      { name: '水枪', hitRate: 0.90, critRate: 0.10, multiplier: 1.1 },
      { name: '水炮', hitRate: 0.75, critRate: 0.15, multiplier: 1.5 },
    ],
  },
  {
    id: 'pikachu',
    name: '皮卡丘',
    maxHp: 80,
    attack: 15,
    defense: 8,
    color: '#FFD54F',
    skills: [
      { name: '十万伏特', hitRate: 0.85, critRate: 0.12, multiplier: 1.4 },
      { name: '电光一闪', hitRate: 0.95, critRate: 0.05, multiplier: 1.0 },
    ],
  },
];

interface BattleRecord {
  id: string;
  playerPokemon: string;
  aiPokemon: string;
  winner: string;
  rounds: number;
  timestamp: string;
}

const battleHistory: BattleRecord[] = [];

app.get('/api/pokemon', (_req, res) => {
  const data = pokemonList.map(p => ({ ...p, hp: p.maxHp }));
  res.json(data);
});

app.post('/api/battle-history', (req, res) => {
  const record: BattleRecord = {
    id: uuidv4(),
    playerPokemon: req.body.playerPokemon,
    aiPokemon: req.body.aiPokemon,
    winner: req.body.winner,
    rounds: req.body.rounds,
    timestamp: new Date().toISOString(),
  };
  battleHistory.push(record);
  res.status(201).json(record);
});

app.get('/api/battle-history', (_req, res) => {
  res.json(battleHistory);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
