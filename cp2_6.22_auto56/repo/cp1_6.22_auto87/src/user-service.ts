import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { User, Project, Task, StudyRecord } from './types';

const users = new Map<string, User>();
const projects = new Map<string, Project>();
const tasks = new Map<string, Task>();
const records = new Map<string, StudyRecord>();

const defaultUserId = 'default-user';

function initDefaultData() {
  if (!users.has(defaultUserId)) {
    users.set(defaultUserId, {
      id: defaultUserId,
      nickname: '学习者',
      dailyGoal: 60,
      createdAt: new Date().toISOString(),
    });
  }
}

initDefaultData();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' });
});

app.get('/api/user', (_req: Request, res: Response) => {
  const user = users.get(defaultUserId);
  res.json({ success: true, data: user });
});

app.put('/api/user', (req: Request, res: Response) => {
  const user = users.get(defaultUserId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  const { nickname, dailyGoal } = req.body;
  if (nickname !== undefined) user.nickname = nickname;
  if (dailyGoal !== undefined) user.dailyGoal = dailyGoal;
  users.set(defaultUserId, user);
  res.json({ success: true, data: user });
});

app.get('/api/projects', (_req: Request, res: Response) => {
  const projectList = Array.from(projects.values()).map((p) => ({
    ...p,
    tasks: Array.from(tasks.values()).filter((t) => t.projectId === p.id),
  }));
  res.json({ success: true, data: projectList });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { name, color } = req.body;
  const id = uuidv4();
  const project: Project = {
    id,
    name,
    color: color || '#667eea',
    createdAt: new Date().toISOString(),
    tasks: [],
  };
  projects.set(id, project);
  res.json({ success: true, data: project });
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const project = projects.get(id);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  const { name, color } = req.body;
  if (name !== undefined) project.name = name;
  if (color !== undefined) project.color = color;
  projects.set(id, project);
  res.json({ success: true, data: project });
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  projects.delete(id);
  const taskIds = Array.from(tasks.values())
    .filter((t) => t.projectId === id)
    .map((t) => t.id);
  taskIds.forEach((tid) => tasks.delete(tid));
  res.json({ success: true });
});

app.post('/api/projects/:projectId/tasks', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const project = projects.get(projectId);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  const { name, estimatedMinutes, deadline } = req.body;
  const id = uuidv4();
  const task: Task = {
    id,
    name,
    estimatedMinutes: Number(estimatedMinutes),
    deadline,
    completed: false,
    completedMinutes: 0,
    projectId,
  };
  tasks.set(id, task);
  res.json({ success: true, data: task });
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const task = tasks.get(id);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  const { name, estimatedMinutes, deadline, completed, completedMinutes } = req.body;
  if (name !== undefined) task.name = name;
  if (estimatedMinutes !== undefined) task.estimatedMinutes = Number(estimatedMinutes);
  if (deadline !== undefined) task.deadline = deadline;
  if (completed !== undefined) task.completed = completed;
  if (completedMinutes !== undefined) task.completedMinutes = Number(completedMinutes);
  tasks.set(id, task);
  res.json({ success: true, data: task });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  tasks.delete(id);
  res.json({ success: true });
});

app.get('/api/records', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  let recordList = Array.from(records.values());
  if (startDate) {
    recordList = recordList.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    recordList = recordList.filter((r) => r.date <= endDate);
  }
  res.json({ success: true, data: recordList });
});

app.post('/api/records', (req: Request, res: Response) => {
  const { date, content, minutes, projectId } = req.body;
  const existing = Array.from(records.values()).find((r) => r.date === date);
  if (existing) {
    existing.content = content;
    existing.minutes = Number(minutes);
    if (projectId !== undefined) existing.projectId = projectId;
    records.set(existing.id, existing);
    res.json({ success: true, data: existing });
    return;
  }
  const id = uuidv4();
  const record: StudyRecord = {
    id,
    date,
    content,
    minutes: Number(minutes),
    projectId,
  };
  records.set(id, record);
  res.json({ success: true, data: record });
});

app.delete('/api/records/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  records.delete(id);
  res.json({ success: true });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

export default app;
