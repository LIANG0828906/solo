import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  getTasks,
  addTask,
  updateTask,
  addComment,
  reorderTasks,
  getPresetTags,
  Tag,
  Priority,
  TaskStatus,
} from './taskStore';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.use(async (_req, _res, next) => {
  await sleep(50);
  next();
});

app.get('/tags', (_req: Request, res: Response) => {
  res.json({ tags: getPresetTags() });
});

app.get('/tasks', (_req: Request, res: Response) => {
  const tasks = getTasks();
  res.json({ tasks });
});

app.post('/tasks', (req: Request, res: Response) => {
  try {
    const { title, description, tags, priority } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: '标题不能为空' });
    }
    if (title.length > 50) {
      return res.status(400).json({ error: '标题长度不能超过50字符' });
    }
    if (!Array.isArray(tags) || !tags.every((t: unknown) => typeof t === 'string')) {
      return res.status(400).json({ error: '标签格式不正确' });
    }
    const validPriorities: Priority[] = ['P0', 'P1', 'P2', 'P3'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: '优先级格式不正确' });
    }

    const presetTags = getPresetTags();
    const validTags = (tags as string[]).filter((t) => presetTags.includes(t as Tag)) as Tag[];

    const task = addTask({
      title: title.trim(),
      description: description || '',
      tags: validTags,
      priority,
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.put('/tasks/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedKeys = ['title', 'description', 'tags', 'priority', 'status', 'order'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (key in updates) {
        filteredUpdates[key] = (updates as Record<string, unknown>)[key];
      }
    }

    if (filteredUpdates.title !== undefined) {
      if (typeof filteredUpdates.title !== 'string' || !filteredUpdates.title.trim()) {
        return res.status(400).json({ error: '标题不能为空' });
      }
      if ((filteredUpdates.title as string).length > 50) {
        return res.status(400).json({ error: '标题长度不能超过50字符' });
      }
    }

    if (filteredUpdates.status !== undefined) {
      const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
      if (!validStatuses.includes(filteredUpdates.status as TaskStatus)) {
        return res.status(400).json({ error: '状态格式不正确' });
      }
    }

    const task = updateTask(id, filteredUpdates);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.json({ task });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/tasks/reorder', (req: Request, res: Response) => {
  try {
    const { sourceStatus, sourceIndex, destinationStatus, destinationIndex } = req.body;
    const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

    if (
      !validStatuses.includes(sourceStatus) ||
      !validStatuses.includes(destinationStatus) ||
      typeof sourceIndex !== 'number' ||
      typeof destinationIndex !== 'number'
    ) {
      return res.status(400).json({ error: '参数格式不正确' });
    }

    const tasks = reorderTasks(sourceStatus, sourceIndex, destinationStatus, destinationIndex);
    res.json({ tasks });
  } catch (err) {
    console.error('Reorder tasks error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/tasks/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    const task = addComment(id, content.trim());
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.status(201).json({ task });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`KanbanLight server running on http://localhost:${PORT}`);
});
