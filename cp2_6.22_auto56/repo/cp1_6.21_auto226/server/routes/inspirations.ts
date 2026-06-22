import { Router, Request, Response } from 'express';
import uniqueSlug from 'unique-slug';
import { getData, setData, findById, Inspiration, InspirationStatus, PRESET_TAGS } from '../data';

const router = Router();

interface FilterQuery {
  tag?: string;
  status?: string;
  search?: string;
}

router.get('/', (req: Request<{}, {}, {}, FilterQuery>, res: Response) => {
  const { tag, status, search } = req.query;
  let result = getData();

  if (tag && PRESET_TAGS.includes(tag)) {
    result = result.filter((item) => item.tags.includes(tag));
  }

  if (status && ['进行中', '已实现', '已归档'].includes(status)) {
    result = result.filter((item) => item.status === status);
  }

  if (search && search.trim()) {
    const keyword = search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
    );
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(result);
});

router.post('/', (req: Request, res: Response) => {
  const { title, content, tags, status, images } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const now = new Date().toISOString();
  const newItem: Inspiration = {
    id: uniqueSlug(),
    title: String(title),
    content: String(content),
    tags: Array.isArray(tags) ? tags.filter((t) => PRESET_TAGS.includes(t)) : [],
    status: (['进行中', '已实现', '已归档'].includes(status) ? status : '进行中') as InspirationStatus,
    images: Array.isArray(images) ? images : [],
    createdAt: now,
    updatedAt: now,
  };

  const data = getData();
  data.unshift(newItem);
  setData(data);

  res.status(201).json(newItem);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, tags, status, images } = req.body;

  const data = getData();
  const index = data.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Inspiration not found' });
  }

  const existing = data[index];
  const updated: Inspiration = {
    ...existing,
    title: title !== undefined ? String(title) : existing.title,
    content: content !== undefined ? String(content) : existing.content,
    tags: Array.isArray(tags) ? tags.filter((t) => PRESET_TAGS.includes(t)) : existing.tags,
    status:
      status !== undefined && ['进行中', '已实现', '已归档'].includes(status)
        ? (status as InspirationStatus)
        : existing.status,
    images: Array.isArray(images) ? images : existing.images,
    updatedAt: new Date().toISOString(),
  };

  data[index] = updated;
  setData(data);

  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = getData();
  const filtered = data.filter((item) => item.id !== id);

  if (filtered.length === data.length) {
    return res.status(404).json({ error: 'Inspiration not found' });
  }

  setData(filtered);
  res.json({ success: true });
});

export default router;
