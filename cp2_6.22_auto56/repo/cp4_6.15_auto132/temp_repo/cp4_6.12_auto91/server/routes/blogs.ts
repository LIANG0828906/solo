import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { blogsMap } from '../index';
import type { Blog } from '../types';

const router = Router();

router.get('/', (_req: Request, res: Response<Blog[]>) => {
  const blogs = Array.from(blogsMap.values());
  res.json(blogs);
});

router.post('/', (req: Request, res: Response<Blog | { error: string }>) => {
  const { title, content, author, coverUrl } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Title, content, and author are required' });
  }

  const newBlog: Blog = {
    id: uuidv4(),
    title,
    content,
    author,
    coverUrl: coverUrl || `https://picsum.photos/seed/${uuidv4()}/800/400`,
    createdAt: new Date(),
  };

  blogsMap.set(newBlog.id, newBlog);
  res.status(201).json(newBlog);
});

router.get('/:id', (req: Request, res: Response<Blog | { error: string }>) => {
  const { id } = req.params;
  const blog = blogsMap.get(id);

  if (!blog) {
    return res.status(404).json({ error: 'Blog not found' });
  }

  res.json(blog);
});

router.delete('/:id', (req: Request, res: Response<{ message: string } | { error: string }>) => {
  const { id } = req.params;

  if (!blogsMap.has(id)) {
    return res.status(404).json({ error: 'Blog not found' });
  }

  blogsMap.delete(id);
  res.json({ message: 'Blog deleted successfully' });
});

export default router;
