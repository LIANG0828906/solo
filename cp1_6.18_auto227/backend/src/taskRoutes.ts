import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Task, Priority } from './types';
import { TaskEngine } from './taskEngine';

export const createTaskRouter = (taskEngine: TaskEngine): Router => {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const tasks = taskEngine.getAllTasks();
    res.json(tasks);
  });

  router.get('/:id', (req: Request, res: Response) => {
    const task = taskEngine.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  });

  router.post('/', (req: Request, res: Response) => {
    const { name, startTime, endTime, priority } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Invalid name' });
      return;
    }
    if (!startTime || typeof startTime !== 'number' || startTime <= 0) {
      res.status(400).json({ error: 'Invalid startTime' });
      return;
    }
    if (!endTime || typeof endTime !== 'number' || endTime <= startTime) {
      res.status(400).json({ error: 'Invalid endTime' });
      return;
    }
    if (!priority || !['high', 'medium', 'low'].includes(priority)) {
      res.status(400).json({ error: 'Invalid priority' });
      return;
    }

    const now = Date.now();
    const task: Task = {
      id: uuidv4(),
      name: name.trim(),
      startTime,
      endTime,
      priority: priority as Priority,
      completed: false,
      createdAt: now,
      updatedAt: now
    };

    const result = taskEngine.createTask(task);

    if (result.conflict) {
      res.status(409).json(result);
    } else {
      res.status(201).json(result.task);
    }
  });

  router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const existing = taskEngine.getTask(id);
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const validUpdates: Partial<Omit<Task, 'id' | 'createdAt'>> = {};

    if (updates.name !== undefined && typeof updates.name === 'string' && updates.name.trim()) {
      validUpdates.name = updates.name.trim();
    }
    if (updates.startTime !== undefined && typeof updates.startTime === 'number' && updates.startTime > 0) {
      validUpdates.startTime = updates.startTime;
    }
    if (updates.endTime !== undefined && typeof updates.endTime === 'number') {
      const checkStartTime = validUpdates.startTime ?? existing.startTime;
      if (updates.endTime > checkStartTime) {
        validUpdates.endTime = updates.endTime;
      } else {
        res.status(400).json({ error: 'endTime must be after startTime' });
        return;
      }
    }
    if (updates.priority !== undefined && ['high', 'medium', 'low'].includes(updates.priority)) {
      validUpdates.priority = updates.priority as Priority;
    }
    if (updates.completed !== undefined && typeof updates.completed === 'boolean') {
      validUpdates.completed = updates.completed;
    }
    if (updates.updatedAt !== undefined && typeof updates.updatedAt === 'number') {
      validUpdates.updatedAt = updates.updatedAt;
    }

    const result = taskEngine.updateTask(id, validUpdates);
    if (!result) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (result.conflict) {
      res.status(409).json(result);
    } else {
      res.json(result.task);
    }
  });

  router.delete('/:id', (req: Request, res: Response) => {
    const deleted = taskEngine.deleteTask(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ success: true });
  });

  router.get('/stats/summary', (req: Request, res: Response) => {
    res.json(taskEngine.getStats());
  });

  return router;
};
