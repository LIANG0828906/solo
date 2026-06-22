import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  color: string;
}

interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  multiSelect: boolean;
  endTime: number;
  createdAt: number;
  isActive: boolean;
}

interface CreateVoteRequest {
  title: string;
  description: string;
  options: string[];
  multiSelect: boolean;
  durationMinutes: number;
}

interface SubmitVoteRequest {
  optionIds: string[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const votes: Map<string, Vote> = new Map();
const ipRateLimit: Map<string, number> = new Map();

const COLOR_PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

function getRemainingTime(vote: Vote): number {
  return Math.max(0, vote.endTime - Date.now());
}

function isVoteActive(vote: Vote): boolean {
  return vote.isActive && getRemainingTime(vote) > 0;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastSubmit = ipRateLimit.get(ip) || 0;
  if (now - lastSubmit < 10000) {
    return false;
  }
  ipRateLimit.set(ip, now);
  return true;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  return forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
}

const sampleVotes: CreateVoteRequest[] = [
  {
    title: '您最喜欢的编程语言是？',
    description: '请选择您日常使用最多的编程语言',
    options: ['JavaScript', 'Python', 'Java', 'Go'],
    multiSelect: false,
    durationMinutes: 60
  },
  {
    title: '团队建设活动投票',
    description: '请选择您希望参加的团队活动（可多选）',
    options: ['户外拓展', '聚餐', 'KTV', '桌游'],
    multiSelect: true,
    durationMinutes: 120
  },
  {
    title: '下周会议时间安排',
    description: '请选择您方便参会的时间段',
    options: ['周一上午', '周二下午', '周三上午', '周四下午'],
    multiSelect: true,
    durationMinutes: 30
  }
];

sampleVotes.forEach((sample, index) => {
  const voteId = uuidv4();
  const vote: Vote = {
    id: voteId,
    title: sample.title,
    description: sample.description,
    options: sample.options.map((text, i) => ({
      id: uuidv4(),
      text,
      votes: Math.floor(Math.random() * 50),
      color: COLOR_PALETTE[i % COLOR_PALETTE.length]
    })),
    multiSelect: sample.multiSelect,
    endTime: Date.now() + sample.durationMinutes * 60 * 1000,
    createdAt: Date.now(),
    isActive: true
  };
  votes.set(voteId, vote);
});

app.get('/api/votes', (_req: Request, res: Response) => {
  const voteList = Array.from(votes.values()).map(vote => ({
    id: vote.id,
    title: vote.title,
    optionCount: vote.options.length,
    remainingTime: getRemainingTime(vote),
    isActive: isVoteActive(vote)
  }));
  res.json(voteList);
});

app.get('/api/votes/:id', (req: Request, res: Response) => {
  const vote = votes.get(req.params.id);
  if (!vote) {
    return res.status(404).json({ error: '投票不存在' });
  }
  res.json({
    ...vote,
    remainingTime: getRemainingTime(vote),
    isActive: isVoteActive(vote)
  });
});

app.post('/api/votes', (req: Request<{}, {}, CreateVoteRequest>, res: Response) => {
  const { title, description, options, multiSelect, durationMinutes } = req.body;
  
  if (!title || !options || options.length < 2) {
    return res.status(400).json({ error: '请提供标题和至少2个选项' });
  }

  const voteId = uuidv4();
  const vote: Vote = {
    id: voteId,
    title,
    description: description || '',
    options: options.map((text, index) => ({
      id: uuidv4(),
      text,
      votes: 0,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length]
    })),
    multiSelect,
    endTime: Date.now() + durationMinutes * 60 * 1000,
    createdAt: Date.now(),
    isActive: true
  };

  votes.set(voteId, vote);
  res.status(201).json(vote);
});

app.post('/api/votes/:id/submit', (req: Request<{ id: string }, {}, SubmitVoteRequest>, res: Response) => {
  const vote = votes.get(req.params.id);
  if (!vote) {
    return res.status(404).json({ error: '投票不存在' });
  }

  if (!isVoteActive(vote)) {
    return res.status(400).json({ error: '投票已结束' });
  }

  const { optionIds } = req.body;
  if (!optionIds || optionIds.length === 0) {
    return res.status(400).json({ error: '请选择至少一个选项' });
  }

  if (!vote.multiSelect && optionIds.length > 1) {
    return res.status(400).json({ error: '该投票不允许多选' });
  }

  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: '投票过于频繁，请10秒后再试' });
  }

  for (const optionId of optionIds) {
    const option = vote.options.find(o => o.id === optionId);
    if (option) {
      option.votes += 1;
    }
  }

  res.json({
    success: true,
    results: vote.options.map(o => ({
      id: o.id,
      text: o.text,
      votes: o.votes,
      color: o.color
    }))
  });
});

app.get('/api/votes/:id/results', (req: Request, res: Response) => {
  const vote = votes.get(req.params.id);
  if (!vote) {
    return res.status(404).json({ error: '投票不存在' });
  }

  const totalVotes = vote.options.reduce((sum, o) => sum + o.votes, 0);
  
  res.json({
    voteId: vote.id,
    title: vote.title,
    totalVotes,
    remainingTime: getRemainingTime(vote),
    isActive: isVoteActive(vote),
    results: vote.options.map(o => ({
      id: o.id,
      text: o.text,
      votes: o.votes,
      color: o.color,
      percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
    }))
  });
});

app.listen(PORT, () => {
  console.log(`投票服务已启动在端口 ${PORT}`);
  console.log(`示例投票已创建，访问 http://localhost:5173 查看效果`);
});
