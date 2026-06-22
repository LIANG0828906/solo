import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LeaderboardEntry } from '../types';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'leaderboard.json');

let leaderboardCache: LeaderboardEntry[] | null = null;
let lastReadTime = 0;
const CACHE_TTL = 1000;

function readLeaderboard(): LeaderboardEntry[] {
  const now = Date.now();
  
  if (leaderboardCache && now - lastReadTime < CACHE_TTL) {
    return leaderboardCache;
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      leaderboardCache = [];
    } else {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      leaderboardCache = JSON.parse(data) as LeaderboardEntry[];
    }
    lastReadTime = now;
    return leaderboardCache;
  } catch (error) {
    console.error('Error reading leaderboard:', error);
    return [];
  }
}

function writeLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
    leaderboardCache = entries;
    lastReadTime = Date.now();
  } catch (error) {
    console.error('Error writing leaderboard:', error);
    throw error;
  }
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const entries = readLeaderboard();
    const sorted = [...entries].sort((a, b) => 
      Math.max(b.score1, b.score2) - Math.max(a.score1, a.score2)
    );
    res.json({ success: true, entries: sorted });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to get leaderboard' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const entry: LeaderboardEntry = req.body;

    if (!entry.id || !entry.player1 || !entry.player2) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const entries = readLeaderboard();
    entries.push(entry);
    writeLeaderboard(entries);

    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error adding leaderboard entry:', error);
    res.status(500).json({ success: false, message: 'Failed to add entry' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const entryId = req.params.id;
    const entries = readLeaderboard();
    const filtered = entries.filter(e => e.id !== entryId);

    if (filtered.length === entries.length) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    writeLeaderboard(filtered);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting leaderboard entry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete entry' });
  }
});

export default router;
