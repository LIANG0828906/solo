import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { SocketManager, Poll, VoteOption } from './socketManager';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(cors());
app.use(express.json());

const polls: Map<string, Poll> = new Map();
const voterRecords: Map<string, Set<string>> = new Map();

const socketManager = new SocketManager(io);
socketManager.setPollsStore(polls as any, voterRecords as any);

interface CreatePollRequest {
  question: string;
  type: 'single' | 'multiple';
  options: string[];
}

const seedPolls = () => {
  const demoPoll: Poll = {
    id: 'demo-' + uuidv4().substr(0, 8),
    question: '本次会议的时间安排是否合理？',
    type: 'single',
    options: [
      { id: uuidv4(), text: '非常合理', count: 15 },
      { id: uuidv4(), text: '比较合理', count: 23 },
      { id: uuidv4(), text: '一般', count: 8 },
      { id: uuidv4(), text: '不太合理', count: 4 },
    ],
    status: 'ended',
    totalVoters: 50,
    createdAt: Date.now() - 86400000,
    endedAt: Date.now() - 82800000,
  };

  const demoPoll2: Poll = {
    id: 'demo-' + uuidv4().substr(0, 8),
    question: '您最希望下次会议讨论哪些主题？（可多选）',
    type: 'multiple',
    options: [
      { id: uuidv4(), text: '产品路线图规划', count: 32 },
      { id: uuidv4(), text: '技术架构升级', count: 28 },
      { id: uuidv4(), text: '团队协作优化', count: 19 },
      { id: uuidv4(), text: '客户反馈分析', count: 24 },
      { id: uuidv4(), text: '绩效考核方案', count: 11 },
    ],
    status: 'ended',
    totalVoters: 45,
    createdAt: Date.now() - 172800000,
    endedAt: Date.now() - 169200000,
  };

  polls.set(demoPoll.id, demoPoll);
  polls.set(demoPoll2.id, demoPoll2);
};

seedPolls();

app.post('/api/polls', (req: Request, res: Response) => {
  try {
    const { question, type, options } = req.body as CreatePollRequest;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: '问题不能为空' });
    }

    if (!type || (type !== 'single' && type !== 'multiple')) {
      return res.status(400).json({ error: '无效的投票类型' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: '至少需要两个选项' });
    }

    const validOptions = options.filter(o => typeof o === 'string' && o.trim());
    if (validOptions.length < 2) {
      return res.status(400).json({ error: '有效选项至少需要两个' });
    }

    const pollOptions: VoteOption[] = validOptions.map(text => ({
      id: uuidv4(),
      text: text.trim(),
      count: 0,
    }));

    const poll: Poll = {
      id: uuidv4(),
      question: question.trim(),
      type,
      options: pollOptions,
      status: 'pending',
      totalVoters: 0,
      createdAt: Date.now(),
    };

    polls.set(poll.id, poll);
    voterRecords.set(poll.id, new Set());
    socketManager.emitVoteCreated(poll);

    res.status(201).json(poll);
  } catch (err) {
    console.error('创建投票错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/polls', (_req: Request, res: Response) => {
  const allPolls = Array.from(polls.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json(allPolls);
});

app.get('/api/polls/:id', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }
  res.json(poll);
});

app.patch('/api/polls/:id/start', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  if (poll.status !== 'pending') {
    return res.status(400).json({ error: '投票状态不允许发起' });
  }

  poll.status = 'active';
  polls.set(poll.id, poll);

  io.to(poll.id).emit('voteStarted', poll);
  res.json(poll);
});

app.patch('/api/polls/:id/end', (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: '投票不存在' });
  }

  if (poll.status !== 'active') {
    return res.status(400).json({ error: '投票未在进行中' });
  }

  poll.status = 'ended';
  poll.endedAt = Date.now();
  polls.set(poll.id, poll);

  io.to(poll.id).emit('voteEnded', { pollId: poll.id, endedAt: poll.endedAt });
  res.json(poll);
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', polls: polls.size });
});

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 远程会议投票器服务已启动
  ----------------------------------------
  📡 API 服务端口: ${PORT}
  🔌 Socket.IO: 已就绪
  📊 示例投票: ${polls.size} 个
  ----------------------------------------
  🌐 访问地址:
     主持人端: http://localhost:5173/host (或Vite分配的其他端口)
     参会者端: (在主持人端复制链接获取)
  ========================================
  `);
});

export default app;
