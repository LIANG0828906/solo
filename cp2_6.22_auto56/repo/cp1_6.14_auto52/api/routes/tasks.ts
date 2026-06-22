import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  db.read();
  res.json(db.data!.tasks);
});

router.post('/', (req, res) => {
  db.read();
  const { ideaId, title, dueDate, assigneeId, priority } = req.body;

  const assignee = db.data!.users.find(u => u.id === assigneeId);
  if (!assignee) {
    return res.status(400).json({ error: '负责人不存在' });
  }

  const idea = db.data!.ideas.find(i => i.id === ideaId);
  if (!idea) {
    return res.status(404).json({ error: '创意不存在' });
  }

  const newTask = {
    id: uuidv4(),
    ideaId,
    title,
    dueDate,
    assigneeId,
    assigneeName: assignee.name,
    priority: priority || 'medium',
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  db.data!.tasks.unshift(newTask as any);

  idea.status = 'converted';
  idea.taskId = newTask.id;

  db.write();

  res.status(201).json({ task: newTask, idea: { id: idea.id, status: idea.status, taskId: idea.taskId } });
});

router.get('/:id', (req, res) => {
  db.read();
  const task = db.data!.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

export default router;
