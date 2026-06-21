import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getIO, getOnlineUsers } from './socket.js';
import type { Task, Sprint, ActivityEntry } from '../shared/types.js';

const app = express();

app.use(cors());
app.use(express.json());

const tasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Design system setup',
    description: 'Initialize design tokens, color palette, and typography scale',
    assignee: 'Alice',
    priority: 'high',
    status: 'todo',
    order: 0,
    storyPoints: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'User authentication flow',
    description: 'Implement login, registration, and password reset',
    assignee: 'Bob',
    priority: 'high',
    status: 'todo',
    order: 1,
    storyPoints: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Kanban board layout',
    description: 'Build the drag-and-drop board with three columns',
    assignee: 'Carol',
    priority: 'medium',
    status: 'in-progress',
    order: 0,
    storyPoints: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'REST API endpoints',
    description: 'Create CRUD endpoints for tasks and sprint management',
    assignee: 'Dave',
    priority: 'medium',
    status: 'in-progress',
    order: 1,
    storyPoints: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Project scaffolding',
    description: 'Set up the monorepo with Vite, Express, and TypeScript',
    assignee: 'Alice',
    priority: 'low',
    status: 'done',
    order: 0,
    storyPoints: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'CI/CD pipeline',
    description: 'Configure GitHub Actions for lint, test, and deploy',
    assignee: 'Bob',
    priority: 'low',
    status: 'done',
    order: 1,
    storyPoints: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let sprint: Sprint = {
  id: uuidv4(),
  name: 'Sprint 1',
  startDate: '2026-06-22',
  endDate: '2026-06-28',
  totalStoryPoints: 32,
  dailyRemaining: [
    { date: '2026-06-22', remaining: 32 },
    { date: '2026-06-23', remaining: 28 },
    { date: '2026-06-24', remaining: 24 },
    { date: '2026-06-25', remaining: 18 },
    { date: '2026-06-26', remaining: 12 },
    { date: '2026-06-27', remaining: 6 },
    { date: '2026-06-28', remaining: 0 },
  ],
};

const activities: ActivityEntry[] = [];

function addActivity(user: string, action: string, taskTitle: string) {
  const entry: ActivityEntry = {
    id: uuidv4(),
    user,
    action,
    taskTitle,
    timestamp: new Date().toISOString(),
  };
  activities.unshift(entry);
  getIO().emit('activity:new', entry);
}

app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(tasks);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, assignee, priority, status, order, storyPoints } = req.body;
  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    title: title ?? '',
    description: description ?? '',
    assignee: assignee ?? '',
    priority: priority ?? 'medium',
    status: status ?? 'todo',
    order: order ?? tasks.filter(t => (t.status ?? 'todo') === (status ?? 'todo')).length,
    storyPoints: storyPoints ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(task);
  addActivity(assignee ?? 'Unknown', 'created', task.title);
  getIO().emit('task:updated', tasks);
  res.status(201).json(task);
});

app.post('/api/tasks/:id/update', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const { title, description, assignee, priority, status, order, storyPoints } = req.body;
  if (title !== undefined) tasks[idx].title = title;
  if (description !== undefined) tasks[idx].description = description;
  if (assignee !== undefined) tasks[idx].assignee = assignee;
  if (priority !== undefined) tasks[idx].priority = priority;
  if (status !== undefined) tasks[idx].status = status;
  if (order !== undefined) tasks[idx].order = order;
  if (storyPoints !== undefined) tasks[idx].storyPoints = storyPoints;
  tasks[idx].updatedAt = new Date().toISOString();
  addActivity(req.body.user ?? 'Unknown', 'updated', tasks[idx].title);
  getIO().emit('task:updated', tasks);
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const [removed] = tasks.splice(idx, 1);
  addActivity(req.body?.user ?? 'Unknown', 'deleted', removed.title);
  getIO().emit('task:updated', tasks);
  res.json({ success: true });
});

app.get('/api/sprint', (_req: Request, res: Response) => {
  res.json(sprint);
});

app.post('/api/sprint', (req: Request, res: Response) => {
  sprint = { ...sprint, ...req.body, id: sprint.id };
  getIO().emit('sprint:updated', sprint);
  res.json(sprint);
});

app.get('/api/activities', (_req: Request, res: Response) => {
  res.json(activities);
});

app.get('/api/users/online', (_req: Request, res: Response) => {
  res.json(getOnlineUsers());
});

export default app;
