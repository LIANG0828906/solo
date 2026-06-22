import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

interface Task {
  id: string;
  projectId: string;
  name: string;
  optimistic: number;
  pessimistic: number;
  mostLikely: number;
  order: number;
  createdAt: number;
}

interface EstimateResult {
  taskId: string;
  taskName: string;
  pert: number;
  poker: number;
}

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const projects = new Map<string, Project>();
const tasks = new Map<string, Task>();

function calculatePERT(optimistic: number, pessimistic: number, mostLikely: number): number {
  return (optimistic + 4 * mostLikely + pessimistic) / 6;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function calculatePoker(mostLikely: number, seed: number): number {
  const offset = (seededRandom(seed) * 0.4 - 0.2) * mostLikely;
  return Math.max(0, mostLikely + offset);
}

app.get('/api/projects', (_req, res) => {
  const projectList = Array.from(projects.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  res.json(projectList);
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '项目名称不能为空' });
  }
  const id = uuidv4();
  const project: Project = {
    id,
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: Date.now(),
  };
  projects.set(id, project);
  res.status(201).json(project);
});

app.post('/api/tasks', (req, res) => {
  const { projectId, name, optimistic, pessimistic, mostLikely } = req.body;

  if (!projectId || !projects.has(projectId)) {
    return res.status(400).json({ error: '无效的项目ID' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '任务名称不能为空' });
  }
  if (
    typeof optimistic !== 'number' ||
    typeof pessimistic !== 'number' ||
    typeof mostLikely !== 'number' ||
    optimistic < 0 ||
    pessimistic < 0 ||
    mostLikely < 0
  ) {
    return res.status(400).json({ error: '估算值必须为非负数字' });
  }

  const projectTasks = Array.from(tasks.values()).filter(
    (t) => t.projectId === projectId
  );

  const id = uuidv4();
  const task: Task = {
    id,
    projectId,
    name: name.trim(),
    optimistic,
    pessimistic,
    mostLikely,
    order: projectTasks.length,
    createdAt: Date.now(),
  };
  tasks.set(id, task);
  res.status(201).json(task);
});

app.get('/api/tasks/:projectId', (req, res) => {
  const { projectId } = req.params;
  if (!projects.has(projectId)) {
    return res.status(404).json({ error: '项目不存在' });
  }
  const projectTasks = Array.from(tasks.values())
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.order - b.order);
  res.json(projectTasks);
});

app.get('/api/tasks/:projectId/estimates', (req, res) => {
  const { projectId } = req.params;
  if (!projects.has(projectId)) {
    return res.status(404).json({ error: '项目不存在' });
  }

  const projectTasks = Array.from(tasks.values())
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.order - b.order);

  const estimates: EstimateResult[] = projectTasks.map((task, index) => ({
    taskId: task.id,
    taskName: task.name,
    pert: Number(calculatePERT(task.optimistic, task.pessimistic, task.mostLikely).toFixed(2)),
    poker: Number(calculatePoker(task.mostLikely, task.createdAt + index).toFixed(2)),
  }));

  res.json(estimates);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
