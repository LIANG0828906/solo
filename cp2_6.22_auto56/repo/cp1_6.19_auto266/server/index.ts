import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

interface Member {
  id: string;
  name: string;
  elo: number;
  initialElo: number;
  createdAt: string;
}

interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  result: 'win' | 'loss' | 'draw';
  date: string;
  player1OldElo: number;
  player2OldElo: number;
  player1NewElo: number;
  player2NewElo: number;
}

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const members = new Map<string, Member>();
const matches: Match[] = [];
const seasons: Season[] = [];

const K_FACTOR = 32;

function calculateElo(
  winnerOld: number,
  loserOld: number,
  isDraw: boolean = false
): { winnerNew: number; loserNew: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserOld - winnerOld) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerOld - loserOld) / 400));

  if (isDraw) {
    return {
      winnerNew: Math.round(winnerOld + K_FACTOR * (0.5 - expectedWinner)),
      loserNew: Math.round(loserOld + K_FACTOR * (0.5 - expectedLoser)),
    };
  }

  return {
    winnerNew: Math.round(winnerOld + K_FACTOR * (1 - expectedWinner)),
    loserNew: Math.round(loserOld + K_FACTOR * (0 - expectedLoser)),
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

app.get('/api/members', (req: Request, res: Response) => {
  const list = Array.from(members.values()).sort((a, b) => b.elo - a.elo);
  res.json(list);
});

app.get('/api/members/:id', (req: Request, res: Response) => {
  const member = members.get(req.params.id);
  if (!member) {
    return res.status(404).json({ error: '会员不存在' });
  }
  res.json(member);
});

app.post('/api/members', (req: Request, res: Response) => {
  const { id, name, elo } = req.body;
  if (!id || !name || elo === undefined || elo === null) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  if (members.has(id)) {
    return res.status(400).json({ error: '会员ID已存在' });
  }
  const member: Member = {
    id,
    name,
    elo: Number(elo),
    initialElo: Number(elo),
    createdAt: new Date().toISOString(),
  };
  members.set(id, member);
  res.status(201).json(member);
});

app.put('/api/members/:id', (req: Request, res: Response) => {
  const existing = members.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '会员不存在' });
  }
  const { name, elo } = req.body;
  const updated: Member = {
    ...existing,
    name: name ?? existing.name,
    elo: elo !== undefined ? Number(elo) : existing.elo,
  };
  members.set(req.params.id, updated);
  res.json(updated);
});

app.delete('/api/members/:id', (req: Request, res: Response) => {
  if (!members.has(req.params.id)) {
    return res.status(404).json({ error: '会员不存在' });
  }
  members.delete(req.params.id);
  res.status(204).send();
});

app.get('/api/matches', (req: Request, res: Response) => {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  res.json(sorted);
});

app.post('/api/matches', (req: Request, res: Response) => {
  const { player1Id, player2Id, result, date } = req.body;
  if (!player1Id || !player2Id || !result || !date) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  if (player1Id === player2Id) {
    return res.status(400).json({ error: '对局双方不能相同' });
  }
  const p1 = members.get(player1Id);
  const p2 = members.get(player2Id);
  if (!p1 || !p2) {
    return res.status(404).json({ error: '会员不存在' });
  }

  const p1Old = p1.elo;
  const p2Old = p2.elo;
  let p1New: number, p2New: number;

  if (result === 'draw') {
    const r = calculateElo(p1Old, p2Old, true);
    p1New = r.winnerNew;
    p2New = r.loserNew;
  } else if (result === 'win') {
    const r = calculateElo(p1Old, p2Old, false);
    p1New = r.winnerNew;
    p2New = r.loserNew;
  } else {
    const r = calculateElo(p2Old, p1Old, false);
    p2New = r.winnerNew;
    p1New = r.loserNew;
  }

  p1.elo = p1New;
  p2.elo = p2New;
  members.set(player1Id, p1);
  members.set(player2Id, p2);

  const match: Match = {
    id: generateId(),
    player1Id,
    player2Id,
    result,
    date,
    player1OldElo: p1Old,
    player2OldElo: p2Old,
    player1NewElo: p1New,
    player2NewElo: p2New,
  };
  matches.push(match);
  res.status(201).json({ match, player1: p1, player2: p2 });
});

app.get('/api/seasons', (req: Request, res: Response) => {
  const sorted = [...seasons].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

app.post('/api/seasons', (req: Request, res: Response) => {
  const { name, startDate, endDate } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const season: Season = {
    id: generateId(),
    name,
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
  };
  seasons.push(season);

  const seasonMatches = matches.filter((m) => {
    const d = new Date(m.date).getTime();
    return d >= new Date(startDate).getTime() && d <= new Date(endDate).getTime();
  });

  res.status(201).json({ season, matches: seasonMatches });
});

app.get('/api/seasons/:id/ranking', (req: Request, res: Response) => {
  const season = seasons.find((s) => s.id === req.params.id);
  if (!season) {
    return res.status(404).json({ error: '联赛周期不存在' });
  }
  const seasonMatches = matches.filter((m) => {
    const d = new Date(m.date).getTime();
    return (
      d >= new Date(season.startDate).getTime() &&
      d <= new Date(season.endDate).getTime()
    );
  });

  const stats = new Map<
    string,
    { wins: number; losses: number; draws: number; matches: number }
  >();

  for (const m of seasonMatches) {
    for (const pid of [m.player1Id, m.player2Id]) {
      if (!stats.has(pid)) {
        stats.set(pid, { wins: 0, losses: 0, draws: 0, matches: 0 });
      }
    }
    const s1 = stats.get(m.player1Id)!;
    const s2 = stats.get(m.player2Id)!;
    s1.matches++;
    s2.matches++;
    if (m.result === 'win') {
      s1.wins++;
      s2.losses++;
    } else if (m.result === 'loss') {
      s1.losses++;
      s2.wins++;
    } else {
      s1.draws++;
      s2.draws++;
    }
  }

  const ranking = Array.from(stats.entries())
    .map(([memberId, s]) => {
      const member = members.get(memberId);
      const winRate = s.matches > 0 ? ((s.wins + s.draws * 0.5) / s.matches) * 100 : 0;
      return {
        memberId,
        name: member?.name ?? '未知',
        elo: member?.elo ?? 0,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        matches: s.matches,
        winRate: Math.round(winRate * 10) / 10,
      };
    })
    .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches);

  const mostActive = [...ranking].sort((a, b) => b.matches - a.matches)[0];

  res.json({ season, ranking, mostActive });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Chess Club Server running on port ${PORT}`);
});
