import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const tasks = new Map();

app.get('/tasks', (req, res) => {
  const allTasks = Array.from(tasks.values());
  allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(allTasks);
});

app.post('/tasks', (req, res) => {
  const { description, type, lat, lng } = req.body;
  if (!description || description.trim() === '') {
    return res.status(400).json({ error: '任务描述不能为空' });
  }
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: '必须提供位置信息' });
  }
  const task = {
    id: uuidv4(),
    description: description.trim(),
    type: type || 'daily',
    lat: Number(lat),
    lng: Number(lng),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

app.patch('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  const { completed } = req.body;
  if (completed !== undefined) {
    task.completed = Boolean(completed);
    task.completedAt = task.completed ? new Date().toISOString() : null;
  }
  tasks.set(id, task);
  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  if (!tasks.has(id)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  tasks.delete(id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
