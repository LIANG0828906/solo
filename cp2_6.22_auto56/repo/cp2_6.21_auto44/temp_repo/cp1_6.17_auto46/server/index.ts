import express, { Request, Response } from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  description?: string;
}

interface StatsResult {
  person: string;
  taskCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  tasks: Task[];
}

interface Data {
  tasks: Task[];
}

const app = express();
const port = 4000;

const file = path.join(__dirname, 'data', 'db.json');
const adapter = new JSONFile<Data>(file);
const db = new Low<Data>(adapter, { tasks: [] });

await db.read();

app.use(cors());
app.use(express.json());

app.get('/api/tasks', (_req: Request, res: Response<Task[]>) => {
  const tasks = db.data.tasks.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(tasks);
});

app.post('/api/tasks', async (req: Request<unknown, unknown, Omit<Task, 'id' | 'createdAt' | 'status' | 'actualHours'>>, res: Response<Task>) => {
  const { title, assignee, estimatedHours, description } = req.body;

  if (!title || !assignee || !estimatedHours) {
    return res.status(400).json({ error: '缺少必要字段' } as unknown as Task);
  }

  const newTask: Task = {
    id: uuidv4(),
    title,
    assignee,
    status: 'todo',
    estimatedHours,
    actualHours: 0,
    createdAt: new Date().toISOString(),
    description
  };

  db.data.tasks.push(newTask);
  await db.write();
  res.json(newTask);
});

app.put('/api/tasks/:id', async (req: Request<{ id: string }, unknown, Partial<Task>>, res: Response<Task | { error: string }>) => {
  const { id } = req.params;
  const updates = req.body;

  const taskIndex = db.data.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }

  db.data.tasks[taskIndex] = { ...db.data.tasks[taskIndex], ...updates };
  await db.write();
  res.json(db.data.tasks[taskIndex]);
});

app.delete('/api/tasks/:id', async (req: Request<{ id: string }>, res: Response<{ success: boolean; error?: string }>) => {
  const { id } = req.params;

  const taskIndex = db.data.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: '任务不存在' });
  }

  db.data.tasks.splice(taskIndex, 1);
  await db.write();
  res.json({ success: true });
});

app.get('/api/stats', (req: Request<unknown, unknown, unknown, { startDate?: string; endDate?: string; person?: string }>, res: Response<StatsResult[]>) => {
  const { startDate, endDate, person } = req.query;
  
  let filteredTasks = [...db.data.tasks];

  if (startDate) {
    filteredTasks = filteredTasks.filter(t => 
      dayjs(t.createdAt).isAfter(dayjs(startDate).subtract(1, 'day'))
    );
  }

  if (endDate) {
    filteredTasks = filteredTasks.filter(t => 
      dayjs(t.createdAt).isBefore(dayjs(endDate).add(1, 'day'))
    );
  }

  if (person) {
    filteredTasks = filteredTasks.filter(t => t.assignee === person);
  }

  const statsMap = new Map<string, StatsResult>();

  for (const task of filteredTasks) {
    if (!statsMap.has(task.assignee)) {
      statsMap.set(task.assignee, {
        person: task.assignee,
        taskCount: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        tasks: []
      });
    }

    const stat = statsMap.get(task.assignee)!;
    stat.taskCount += 1;
    stat.totalEstimatedHours += task.estimatedHours;
    stat.totalActualHours += task.actualHours;
    stat.tasks.push(task);
  }

  const result = Array.from(statsMap.values()).sort((a, b) => b.totalActualHours - a.totalActualHours);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
