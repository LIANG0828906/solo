import express from 'express';
import cors from 'cors';
import { courseStore, CourseInput } from './store';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/courses', (_req, res) => {
  const courses = courseStore.getAll();
  res.json(courses);
});

app.get('/api/courses/:id', (req, res) => {
  const course = courseStore.getById(req.params.id);
  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }
  res.json(course);
});

app.post('/api/courses', (req, res) => {
  try {
    const input = req.body as CourseInput;
    if (!input.name || input.dayOfWeek === undefined || input.startSlot === undefined) {
      res.status(400).json({ error: '缺少必要字段' });
      return;
    }
    const course = courseStore.create(input);
    res.status(201).json(course);
  } catch {
    res.status(400).json({ error: '无效的请求数据' });
  }
});

app.put('/api/courses/:id', (req, res) => {
  try {
    const input = req.body as CourseInput;
    const course = courseStore.update(req.params.id, input);
    if (!course) {
      res.status(404).json({ error: '课程不存在' });
      return;
    }
    res.json(course);
  } catch {
    res.status(400).json({ error: '无效的请求数据' });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  const success = courseStore.delete(req.params.id);
  if (!success) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }
  res.json({ success: true });
});

app.post('/api/courses/batch', (req, res) => {
  try {
    const inputs = req.body as CourseInput[];
    if (!Array.isArray(inputs)) {
      res.status(400).json({ error: '需要数组格式' });
      return;
    }
    const courses = courseStore.batchCreate(inputs);
    res.status(201).json(courses);
  } catch {
    res.status(400).json({ error: '无效的请求数据' });
  }
});

app.listen(PORT, () => {
  console.log(`课表服务已启动: http://localhost:${PORT}`);
});
