import { Router, Request, Response } from 'express';
import { store, genId, Task, Project } from '../store';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(store.projects);
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, deadline, memberIds = [] } = req.body;
  if (!name) return res.status(400).json({ error: '项目名称不能为空' });
  if (description && description.length > 200)
    return res.status(400).json({ error: '描述最多200字' });
  const project: Project = {
    id: genId(),
    name,
    description: description || '',
    deadline: deadline || '',
    memberIds,
    createdAt: new Date().toISOString(),
  };
  store.projects.push(project);
  res.status(201).json(project);
});

router.put('/:id', (req: Request, res: Response) => {
  const idx = store.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '项目不存在' });
  const { name, description, deadline, memberIds } = req.body;
  if (description && description.length > 200)
    return res.status(400).json({ error: '描述最多200字' });
  store.projects[idx] = {
    ...store.projects[idx],
    name: name ?? store.projects[idx].name,
    description: description ?? store.projects[idx].description,
    deadline: deadline ?? store.projects[idx].deadline,
    memberIds: memberIds ?? store.projects[idx].memberIds,
  };
  res.json(store.projects[idx]);
});

router.delete('/:id', (req: Request, res: Response) => {
  const idx = store.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '项目不存在' });
  store.projects.splice(idx, 1);
  store.tasks = store.tasks.filter((t) => t.projectId !== req.params.id);
  res.status(204).end();
});

router.get('/:id/tasks', (req: Request, res: Response) => {
  const tasks = store.tasks.filter((t) => t.projectId === req.params.id);
  res.json(tasks);
});

router.post('/:id/tasks', (req: Request, res: Response) => {
  const { title, description = '', status = 'todo', tags = [], assigneeId, estimatedHours = 0, blockedReason } = req.body;
  if (!title) return res.status(400).json({ error: '任务标题不能为空' });
  const task: Task = {
    id: genId(),
    projectId: req.params.id,
    title,
    description,
    status,
    tags,
    assigneeId,
    estimatedHours: Math.min(999, Math.max(0, Number(estimatedHours) || 0)),
    blockedReason: blockedReason?.slice(0, 100),
    createdAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  res.status(201).json(task);
});

router.put('/tasks/:id', (req: Request, res: Response) => {
  const idx = store.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '任务不存在' });
  const { title, description, status, tags, assigneeId, estimatedHours, blockedReason } = req.body;
  const updated: Task = {
    ...store.tasks[idx],
    title: title ?? store.tasks[idx].title,
    description: description ?? store.tasks[idx].description,
    status: status ?? store.tasks[idx].status,
    tags: tags ?? store.tasks[idx].tags,
    assigneeId: assigneeId !== undefined ? assigneeId : store.tasks[idx].assigneeId,
    estimatedHours:
      estimatedHours !== undefined
        ? Math.min(999, Math.max(0, Number(estimatedHours)))
        : store.tasks[idx].estimatedHours,
    blockedReason:
      blockedReason !== undefined ? blockedReason?.slice(0, 100) : store.tasks[idx].blockedReason,
  };
  store.tasks[idx] = updated;
  res.json(updated);
});

router.delete('/tasks/:id', (req: Request, res: Response) => {
  const idx = store.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '任务不存在' });
  store.tasks.splice(idx, 1);
  res.status(204).end();
});

export default router;
