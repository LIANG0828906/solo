import { Router, Request, Response } from 'express';
import type { LeaderboardEntry } from '../types';

const router = Router();

const leaderboard: LeaderboardEntry[] = [
  { playerName: '星际开拓者', survivalDays: 128, submittedAt: Date.now() - 86400000 },
  { playerName: '火星工程师', survivalDays: 96, submittedAt: Date.now() - 172800000 },
  { playerName: '宇宙冒险家', survivalDays: 74, submittedAt: Date.now() - 259200000 },
  { playerName: 'NovaCaptain', survivalDays: 61, submittedAt: Date.now() - 345600000 },
  { playerName: '拓荒者Alpha', survivalDays: 52, submittedAt: Date.now() - 432000000 },
];

router.get('/leaderboard', (_req: Request, res: Response) => {
  const sorted = [...leaderboard]
    .sort((a, b) => b.survivalDays - a.survivalDays)
    .slice(0, 20)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
  res.json(sorted);
});

router.post('/leaderboard', (req: Request, res: Response) => {
  try {
    const { playerName, survivalDays } = req.body as { playerName: string; survivalDays: number };
    if (!playerName || typeof survivalDays !== 'number') {
      return res.status(400).json({ success: false, message: '参数无效' });
    }
    const entry: LeaderboardEntry = {
      playerName: playerName.slice(0, 20),
      survivalDays,
      submittedAt: Date.now(),
    };
    leaderboard.push(entry);
    const sorted = [...leaderboard].sort((a, b) => b.survivalDays - a.survivalDays);
    const rank = sorted.findIndex(e => e === entry) + 1;
    res.json({ success: true, rank, message: `排名第 ${rank} 位！` });
  } catch (err) {
    res.status(500).json({ success: false, message: '提交失败' });
  }
});

export default router;
