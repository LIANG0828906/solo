import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { stringify } from 'csv-stringify/sync';
import crypto from 'crypto';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  type: 'single' | 'multiple';
  deadline?: number;
  createdAt: number;
  isActive: boolean;
  creatorFingerprint: string;
  totalVotes: number;
  voters: Set<string>;
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const polls = new Map<string, Poll>();
const clients = new Map<string, Set<WebSocket>>();

const ADMIN_PASSWORD = 'admin123';

app.use(express.json());

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function getFingerprint(req: Request): string {
  const ip = req.ip || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}-${ua}`).digest('hex');
}

function broadcastPollUpdate(pollId: string) {
  const poll = polls.get(pollId);
  if (!poll) return;

  const pollData = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    options: poll.options,
    type: poll.type,
    deadline: poll.deadline,
    createdAt: poll.createdAt,
    isActive: poll.isActive,
    totalVotes: poll.totalVotes,
  };

  const message = JSON.stringify({
    type: 'poll_update',
    poll: pollData,
  });

  const pollClients = clients.get(pollId);
  if (pollClients) {
    pollClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

app.post('/api/polls', (req: Request, res: Response) => {
  const { title, description, options, type, deadline } = req.body;

  if (!title || !options || options.length < 2) {
    return res.status(400).json({ error: '标题和至少2个选项是必填的' });
  }

  if (type !== 'single' && type !== 'multiple') {
    return res.status(400).json({ error: '投票类型必须是单选或多选' });
  }

  const id = generateId();
  const fingerprint = getFingerprint(req);

  const poll: Poll = {
    id,
    title,
    description: description || '',
    options: options.map((text: string, index: number) => ({
      id: `opt-${index}`,
      text,
      votes: 0,
    })),
    type,
    deadline: deadline ? new Date(deadline).getTime() : undefined,
    createdAt: Date.now(),
    isActive: true,
    creatorFingerprint: fingerprint,
    totalVotes: 0,
    voters: new Set(),
  };

  polls.set(id, poll);
  clients.set(id, new Set());

  res.status(201).json({ id });
});

app.get('/api/polls/:id', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  const fingerprint = getFingerprint(req);
  const hasVoted = poll.voters.has(fingerprint);
  const isCreator = poll.creatorFingerprint === fingerprint;

  res.json({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    options: poll.options,
    type: poll.type,
    deadline: poll.deadline,
    createdAt: poll.createdAt,
    isActive: poll.isActive,
    totalVotes: poll.totalVotes,
    hasVoted,
    isCreator,
  });
});

app.post('/api/polls/:id/vote', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  if (!poll.isActive) {
    return res.status(400).json({ error: '投票已结束' });
  }

  if (poll.deadline && Date.now() > poll.deadline) {
    poll.isActive = false;
    return res.status(400).json({ error: '投票已截止' });
  }

  const fingerprint = getFingerprint(req);
  if (poll.voters.has(fingerprint)) {
    return res.status(400).json({ error: '您已经投过票了' });
  }

  const { optionIds } = req.body;
  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return res.status(400).json({ error: '请选择至少一个选项' });
  }

  if (poll.type === 'single' && optionIds.length > 1) {
    return res.status(400).json({ error: '单选投票只能选择一个选项' });
  }

  const validOptions = optionIds.filter((optId: string) =>
    poll.options.some((opt) => opt.id === optId)
  );
  if (validOptions.length === 0) {
    return res.status(400).json({ error: '无效的选项' });
  }

  validOptions.forEach((optId: string) => {
    const option = poll.options.find((opt) => opt.id === optId);
    if (option) {
      option.votes += 1;
    }
  });

  poll.totalVotes += 1;
  poll.voters.add(fingerprint);

  broadcastPollUpdate(poll.id);

  res.json({ success: true });
});

app.get('/api/polls/:id/export', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  const fingerprint = getFingerprint(req);
  const isAdmin = req.headers['x-admin-password'] === ADMIN_PASSWORD;
  const isCreator = poll.creatorFingerprint === fingerprint;

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: '无权限导出' });
  }

  const data = poll.options.map((opt) => ({
    选项: opt.text,
    票数: opt.votes,
    百分比: poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(2) + '%' : '0%',
  }));

  data.push({
    选项: '总计',
    票数: poll.totalVotes,
    百分比: '100%',
  } as any);

  const csv = stringify(data, { header: true, columns: ['选项', '票数', '百分比'] });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${poll.title}.csv"`);
  res.send('\uFEFF' + csv);
});

app.post('/api/polls/:id/end', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  const fingerprint = getFingerprint(req);
  const isAdmin = req.headers['x-admin-password'] === ADMIN_PASSWORD;
  const isCreator = poll.creatorFingerprint === fingerprint;

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: '无权限操作' });
  }

  poll.isActive = false;
  broadcastPollUpdate(poll.id);

  res.json({ success: true });
});

app.delete('/api/polls/:id', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  const fingerprint = getFingerprint(req);
  const isAdmin = req.headers['x-admin-password'] === ADMIN_PASSWORD;
  const isCreator = poll.creatorFingerprint === fingerprint;

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: '无权限操作' });
  }

  polls.delete(req.params.id);
  clients.delete(req.params.id);

  res.json({ success: true });
});

app.get('/api/admin/polls', (req: Request, res: Response) => {
  const isAdmin = req.headers['x-admin-password'] === ADMIN_PASSWORD;
  if (!isAdmin) {
    return res.status(403).json({ error: '管理员密码错误' });
  }

  const pollList = Array.from(polls.values()).map((poll) => ({
    id: poll.id,
    title: poll.title,
    type: poll.type,
    isActive: poll.isActive,
    totalVotes: poll.totalVotes,
    createdAt: poll.createdAt,
    deadline: poll.deadline,
  }));

  res.json({ polls: pollList });
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pollId = url.searchParams.get('pollId');

  if (!pollId || !polls.has(pollId)) {
    ws.close();
    return;
  }

  if (!clients.has(pollId)) {
    clients.set(pollId, new Set());
  }
  clients.get(pollId)!.add(ws);

  const poll = polls.get(pollId)!;
  ws.send(
    JSON.stringify({
      type: 'poll_update',
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        type: poll.type,
        deadline: poll.deadline,
        createdAt: poll.createdAt,
        isActive: poll.isActive,
        totalVotes: poll.totalVotes,
      },
    })
  );

  ws.on('close', () => {
    const pollClients = clients.get(pollId);
    if (pollClients) {
      pollClients.delete(ws);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
