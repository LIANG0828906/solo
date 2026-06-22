import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';

type TaskStatus = 'pending' | 'annotated' | 'reviewed';
type TaskType = 'text' | 'image';

interface Task {
  id: string;
  type: TaskType;
  content: string;
  status: TaskStatus;
  assignee: string | null;
  label: any[] | Record<string, any> | null;
  reviewer: string | null;
  score: number | null;
  createdAt: string;
  annotatedAt: string | null;
  reviewedAt: string | null;
}

interface AnnotateRequest {
  assignee: string;
  label: any[] | Record<string, any>;
}

interface ReviewRequest {
  reviewer: string;
  score: number;
  comment?: string;
}

interface DailyAnnotation {
  date: string;
  count: number;
}

interface ReviewerPassRate {
  reviewer: string;
  total: number;
  passed: number;
  passRate: number;
  avgScore: number;
}

interface Stats {
  total: number;
  pendingCount: number;
  annotatedCount: number;
  reviewedCount: number;
  dailyAnnotations: DailyAnnotation[];
  reviewerPassRates: ReviewerPassRate[];
}

const PORT = 3001;
const DATA_FILE_PATH = path.join(__dirname, 'data', 'tasks.json');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

function readTasks(): Task[] {
  const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
  return JSON.parse(raw) as Task[];
}

function writeTasks(tasks: Task[]): void {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
}

function computeStats(tasks: Task[]): Stats {
  const total = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const annotatedCount = tasks.filter((t) => t.status === 'annotated').length;
  const reviewedCount = tasks.filter((t) => t.status === 'reviewed').length;

  const today = new Date('2026-06-19T00:00:00.000Z');
  const dailyAnnotations: DailyAnnotation[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const nextDate = new Date(d);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = tasks.filter((t) => {
      if (!t.annotatedAt) return false;
      const at = new Date(t.annotatedAt);
      return at >= d && at < nextDate;
    }).length;

    dailyAnnotations.push({ date: dateStr, count });
  }

  const reviewerMap = new Map<string, { total: number; scores: number[]; passed: number }>();
  for (const task of tasks) {
    if (task.status === 'reviewed' && task.reviewer && task.score !== null) {
      const entry = reviewerMap.get(task.reviewer) || { total: 0, scores: [], passed: 0 };
      entry.total++;
      entry.scores.push(task.score);
      if (task.score >= 0.85) entry.passed++;
      reviewerMap.set(task.reviewer, entry);
    }
  }

  const reviewerPassRates: ReviewerPassRate[] = Array.from(reviewerMap.entries()).map(
    ([reviewer, data]) => ({
      reviewer,
      total: data.total,
      passed: data.passed,
      passRate: data.total > 0 ? data.passed / data.total : 0,
      avgScore:
        data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0,
    })
  );

  return {
    total,
    pendingCount,
    annotatedCount,
    reviewedCount,
    dailyAnnotations,
    reviewerPassRates,
  };
}

app.get('/api/tasks', (req: Request, res: Response) => {
  try {
    const { role, status, assignee } = req.query;
    let tasks = readTasks();

    if (typeof status === 'string' && status.length > 0) {
      const statusList = status.split(',').map((s) => s.trim());
      tasks = tasks.filter((t) => statusList.includes(t.status));
    }

    if (typeof assignee === 'string' && assignee.length > 0) {
      tasks = tasks.filter((t) => t.assignee === assignee);
    }

    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/annotate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as AnnotateRequest;

    if (!body.assignee || !body.label) {
      return res.status(400).json({ error: 'Missing assignee or label' });
    }

    const tasks = readTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (tasks[index].status === 'annotated' || tasks[index].status === 'reviewed') {
      return res.status(409).json({ error: 'Task already annotated or reviewed' });
    }

    tasks[index].status = 'annotated';
    tasks[index].assignee = body.assignee;
    tasks[index].label = body.label;
    tasks[index].annotatedAt = new Date().toISOString();

    writeTasks(tasks);

    const updatedTask = tasks[index];
    const stats = computeStats(tasks);

    io.emit('task-updated', updatedTask);
    io.emit('stats-updated', stats);

    res.json(updatedTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/review', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as ReviewRequest;

    if (!body.reviewer || body.score === undefined || body.score === null) {
      return res.status(400).json({ error: 'Missing reviewer or score' });
    }

    const tasks = readTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (tasks[index].status === 'reviewed') {
      return res.status(409).json({ error: 'Task already reviewed' });
    }

    tasks[index].status = 'reviewed';
    tasks[index].reviewer = body.reviewer;
    tasks[index].score = body.score;
    tasks[index].reviewedAt = new Date().toISOString();

    writeTasks(tasks);

    const updatedTask = tasks[index];
    const stats = computeStats(tasks);

    io.emit('task-updated', updatedTask);
    io.emit('stats-updated', stats);

    res.json(updatedTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const tasks = readTasks();
    const stats = computeStats(tasks);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);
  try {
    const tasks = readTasks();
    const stats = computeStats(tasks);
    socket.emit('stats-updated', stats);
  } catch (err: any) {
    console.error('Error sending initial stats:', err.message);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
