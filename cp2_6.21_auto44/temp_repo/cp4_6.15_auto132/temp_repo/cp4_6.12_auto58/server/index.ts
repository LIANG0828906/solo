import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { generateMaze, validateMove, rollDice, MazeData, Position } from './mazeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(LEADERBOARD_FILE)) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
}

interface LeaderboardEntry {
  id: string;
  playerName: string;
  floor: number;
  treasures: number;
  timestamp: number;
}

interface MoveRequest {
  maze: MazeData;
  playerPos: Position;
  direction: 'up' | 'down' | 'left' | 'right';
}

app.post('/api/maze/generate', (req: Request, res: Response) => {
  const startTime = Date.now();
  const { seed } = req.body as { seed?: number };

  try {
    const maze = generateMaze(seed);
    const elapsed = Date.now() - startTime;
    console.log(`Maze generated in ${elapsed}ms`);
    res.json(maze);
  } catch (error) {
    console.error('Error generating maze:', error);
    res.status(500).json({ error: 'Failed to generate maze' });
  }
});

app.post('/api/maze/validateMove', (req: Request, res: Response) => {
  const { maze, playerPos, direction } = req.body as MoveRequest;

  try {
    const result = validateMove(maze, playerPos, direction);

    if (result.type === 'monster' && result.valid) {
      const battleResult = rollDice();
      res.json({ ...result, battleResult });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error validating move:', error);
    res.status(500).json({ error: 'Failed to validate move' });
  }
});

app.get('/api/leaderboard', (req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    const leaderboard: LeaderboardEntry[] = JSON.parse(data);
    leaderboard.sort((a, b) => b.floor - a.floor || b.treasures - a.treasures);
    res.json(leaderboard.slice(0, 20));
  } catch (error) {
    console.error('Error reading leaderboard:', error);
    res.status(500).json({ error: 'Failed to read leaderboard' });
  }
});

app.post('/api/leaderboard', (req: Request, res: Response) => {
  try {
    const entry: Omit<LeaderboardEntry, 'id' | 'timestamp'> = req.body;
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    const leaderboard: LeaderboardEntry[] = JSON.parse(data);
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.floor - a.floor || b.treasures - a.treasures);
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard.slice(0, 100), null, 2));
    res.json(newEntry);
  } catch (error) {
    console.error('Error writing to leaderboard:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/maze/generate`);
  console.log(`  POST /api/maze/validateMove`);
  console.log(`  GET /api/leaderboard`);
  console.log(`  POST /api/leaderboard`);
});

export default app;
