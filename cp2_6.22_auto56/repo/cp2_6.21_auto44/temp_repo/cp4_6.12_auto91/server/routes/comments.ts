import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { commentsMap } from '../index';
import type { Comment } from '../types';

const router = Router();

router.get('/', (_req: Request, res: Response<Comment[]>) => {
  const comments = Array.from(commentsMap.values());
  res.json(comments);
});

router.post('/', (req: Request, res: Response<Comment | { error: string }>) => {
  const { targetId, targetType, content, author } = req.body;

  if (!targetId || !targetType || !content || !author) {
    return res.status(400).json({ error: 'targetId, targetType, content, and author are required' });
  }

  if (targetType !== 'track' && targetType !== 'blog') {
    return res.status(400).json({ error: 'targetType must be either "track" or "blog"' });
  }

  const newComment: Comment = {
    id: uuidv4(),
    targetId,
    targetType,
    content,
    author,
    approved: false,
    createdAt: new Date(),
  };

  commentsMap.set(newComment.id, newComment);
  res.status(201).json(newComment);
});

router.put('/:id', (req: Request, res: Response<Comment | { error: string }>) => {
  const { id } = req.params;
  const comment = commentsMap.get(id);

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  comment.approved = true;
  commentsMap.set(id, comment);
  res.json(comment);
});

router.delete('/:id', (req: Request, res: Response<{ message: string } | { error: string }>) => {
  const { id } = req.params;

  if (!commentsMap.has(id)) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  commentsMap.delete(id);
  res.json({ message: 'Comment deleted successfully' });
});

export default router;
