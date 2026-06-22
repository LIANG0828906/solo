import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Rune, RuneType } from './rune';
import { createRune, RUNE_CONFIG } from './rune';
import type { Monster } from './monster';
import { createMonster } from './monster';
import type { Position } from './maze';

const app = express();
let PORT = 3005;

app.use(cors());
app.use(express.json());

interface GameState {
  wave: number;
  monsters: Monster[];
  runes: Rune[];
  health: number;
  score: number;
  kills: number;
  isGameOver: boolean;
  doubleEffect: boolean;
  doubleEffectEndTime: number;
}

interface RuneInventory {
  fire: number;
  ice: number;
  lightning: number;
}

let gameState: GameState = {
  wave: 0,
  monsters: [],
  runes: [],
  health: 10,
  score: 0,
  kills: 0,
  isGameOver: false,
  doubleEffect: false,
  doubleEffectEndTime: 0,
};

let runeInventory: RuneInventory = {
  fire: 10,
  ice: 10,
  lightning: 10,
};

app.get('/api/game/state', (_req: Request, res: Response) => {
  res.json(gameState);
});

app.post('/api/game/reset', (_req: Request, res: Response) => {
  gameState = {
    wave: 0,
    monsters: [],
    runes: [],
    health: 10,
    score: 0,
    kills: 0,
    isGameOver: false,
    doubleEffect: false,
    doubleEffectEndTime: 0,
  };
  runeInventory = {
    fire: 10,
    ice: 10,
    lightning: 10,
  };
  res.json(gameState);
});

app.post('/api/game/wave', (req: Request, res: Response) => {
  const { wave, path } = req.body as { wave: number; path: Position[] };
  
  if (!path || path.length === 0) {
    return res.status(400).json({ error: 'Path is required' });
  }

  const monsterCount = 3 + wave - 1;
  const healthMultiplier = 1 + (wave - 1) * 0.2;
  const newMonsters: Monster[] = [];

  for (let i = 0; i < monsterCount; i++) {
    const monster = createMonster(path, healthMultiplier);
    monster.position.x = -i * 0.5;
    newMonsters.push(monster);
  }

  gameState.monsters = [...gameState.monsters, ...newMonsters];
  gameState.wave = wave;

  res.json({ monsters: newMonsters, gameState });
});

app.get('/api/runes/inventory', (_req: Request, res: Response) => {
  res.json(runeInventory);
});

app.post('/api/runes/place', (req: Request, res: Response) => {
  const { type, position } = req.body as { type: RuneType; position: Position };

  if (!type || !position) {
    return res.status(400).json({ error: 'Type and position are required' });
  }

  if (runeInventory[type] <= 0) {
    return res.status(400).json({ error: 'No runes available' });
  }

  const existingRune = gameState.runes.find(
    (r) => r.position.x === position.x && r.position.y === position.y
  );

  if (existingRune) {
    return res.status(400).json({ error: 'Rune already exists at this position' });
  }

  const rune = createRune(type, position);
  gameState.runes.push(rune);
  runeInventory[type]--;

  res.json({ success: true, rune, inventory: runeInventory });
});

app.post('/api/monsters/kill', (req: Request, res: Response) => {
  const { id } = req.body as { id: string };

  const monster = gameState.monsters.find((m) => m.id === id);
  if (!monster) {
    return res.status(404).json({ error: 'Monster not found' });
  }

  monster.status = 'dead';
  gameState.kills++;
  gameState.score += 10;

  res.json({ success: true, score: gameState.score, kills: gameState.kills });
});

app.post('/api/score/add', (req: Request, res: Response) => {
  const { points } = req.body as { points: number };
  gameState.score += points;
  res.json({ success: true, score: gameState.score });
});

app.post('/api/health/damage', (req: Request, res: Response) => {
  const { damage } = req.body as { damage: number };
  gameState.health = Math.max(0, gameState.health - damage);
  
  if (gameState.health <= 0) {
    gameState.isGameOver = true;
  }
  
  res.json({ success: true, health: gameState.health, isGameOver: gameState.isGameOver });
});

app.post('/api/double-effect/trigger', (_req: Request, res: Response) => {
  if (gameState.doubleEffect) {
    return res.json({ success: false, message: 'Double effect already active' });
  }
  
  gameState.doubleEffect = true;
  gameState.doubleEffectEndTime = Date.now() + 15000;
  
  res.json({ success: true, endTime: gameState.doubleEffectEndTime });
});

app.post('/api/double-effect/check', (_req: Request, res: Response) => {
  if (gameState.doubleEffect && Date.now() > gameState.doubleEffectEndTime) {
    gameState.doubleEffect = false;
  }
  res.json({ active: gameState.doubleEffect, endTime: gameState.doubleEffectEndTime });
});

app.post('/api/monsters/update', (req: Request, res: Response) => {
  const { monsters } = req.body as { monsters: Monster[] };
  
  const reachedCount = monsters.filter(m => m.status === 'reached').length;
  if (reachedCount > 0) {
    gameState.health = Math.max(0, gameState.health - reachedCount);
    if (gameState.health <= 0) {
      gameState.isGameOver = true;
    }
  }
  
  const newKills = monsters.filter(m => m.status === 'dead' && 
    !gameState.monsters.find(gm => gm.id === m.id && gm.status === 'dead')
  ).length;
  
  if (newKills > 0) {
    gameState.kills += newKills;
    gameState.score += newKills * 10;
  }
  
  gameState.monsters = monsters;
  
  res.json({ 
    success: true, 
    health: gameState.health, 
    kills: gameState.kills, 
    score: gameState.score,
    isGameOver: gameState.isGameOver 
  });
});

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`PORT=${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

startServer(PORT);
