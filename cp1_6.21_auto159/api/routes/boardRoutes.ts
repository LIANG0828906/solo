import { Router, type Request, type Response } from 'express';
import {
  getBoards,
  getBoardById,
  createBoard,
  deleteBoard,
  getTasksByBoardId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addLog,
} from '../store.js';
import type { TaskStatus, TaskPriority } from '../store.js';

const router = Router();

router.get('/boards', (_req: Request, res: Response): void => {
  res.json(getBoards());
});

router.post('/boards', (req: Request, res: Response): void => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const board = createBoard(name, description || '');
  res.status(201).json(board);
});

router.get('/boards/:id', (req: Request, res: Response): void => {
  const board = getBoardById(req.params.id);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  res.json(board);
});

router.delete('/boards/:id', (req: Request, res: Response): void => {
  const ok = deleteBoard(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  res.status(204).end();
});

router.get('/boards/:id/tasks', (req: Request, res: Response): void => {
  const board = getBoardById(req.params.id);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  res.json(getTasksByBoardId(req.params.id));
});

router.post('/boards/:id/tasks', (req: Request, res: Response): void => {
  const board = getBoardById(req.params.id);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  const { title, description, assignee, priority } = req.body;
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const existingTasks = getTasksByBoardId(req.params.id);
  const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), -1);

  const task = createTask({
    boardId: req.params.id,
    title,
    description: description || '',
    assignee: assignee || '',
    priority: priority || 'medium',
    status: 'todo',
    order: maxOrder + 1,
  });

  addLog({
    boardId: req.params.id,
    taskId: task.id,
    taskTitle: task.title,
    action: 'created',
    timestamp: new Date().toISOString(),
    operator: task.assignee,
  });

  res.status(201).json(task);
});

router.put('/tasks/:id', (req: Request, res: Response): void => {
  const existing = getTaskById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const { status, ...rest } = req.body;
  const updates: Partial<{ title: string; description: string; assignee: string; priority: TaskPriority; status: TaskStatus; order: number }> = { ...rest };
  if (status !== undefined) {
    updates.status = status;
  }

  const updated = updateTask(req.params.id, updates);
  if (!updated) {
    res.status(500).json({ error: 'Failed to update task' });
    return;
  }

  if (status !== undefined && status !== existing.status) {
    addLog({
      boardId: updated.boardId,
      taskId: updated.id,
      taskTitle: `${updated.title}: ${existing.status}→${status}`,
      action: 'moved',
      timestamp: new Date().toISOString(),
      operator: updated.assignee,
    });
  }

  res.json(updated);
});

router.delete('/tasks/:id', (req: Request, res: Response): void => {
  const task = getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  addLog({
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
    action: 'deleted',
    timestamp: new Date().toISOString(),
    operator: task.assignee,
  });

  deleteTask(req.params.id);
  res.status(204).end();
});

export default router;
