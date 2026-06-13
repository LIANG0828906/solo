import express, { Request, Response } from 'express';
import cors from 'cors';
import db, { CodeSnippet, PaginationResult } from './db';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const simulateDelay = (ms: number = 100): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

app.get('/api/snippets', async (req: Request, res: Response) => {
  await simulateDelay(100);

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;

  const result = db.getAll(page, pageSize);
  res.json(result);
});

app.get('/api/snippets/search', async (req: Request, res: Response) => {
  await simulateDelay(100);

  const keyword = (req.query.keyword as string) || '';
  const tagsParam = req.query.tags as string;
  const tags = tagsParam ? tagsParam.split(',') : [];
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;

  const result = db.search(keyword, tags, page, pageSize);
  res.json(result);
});

app.get('/api/snippets/:id', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const snippet = db.getById(req.params.id);
  if (!snippet) {
    return res.status(404).json({ error: 'Snippet not found' });
  }
  res.json(snippet);
});

app.post('/api/snippets', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const { title, description, code, language, tags } = req.body;

  if (!title || !code || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (tags && tags.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 tags allowed' });
  }

  const snippet = db.create({
    title,
    description: description || '',
    code,
    language,
    tags: tags || [],
  });

  res.status(201).json(snippet);
});

app.put('/api/snippets/:id', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const snippet = db.update(req.params.id, req.body);
  if (!snippet) {
    return res.status(404).json({ error: 'Snippet not found' });
  }
  res.json(snippet);
});

app.delete('/api/snippets/:id', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const deleted = db.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Snippet not found' });
  }
  res.json({ message: 'Snippet deleted' });
});

app.post('/api/snippets/:id/favorite', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const result = db.toggleFavorite(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Snippet not found' });
  }
  res.json(result);
});

app.get('/api/tags', async (req: Request, res: Response) => {
  await simulateDelay(30);
  const tags = db.getAvailableTags();
  res.json(tags);
});

app.post('/api/snippets/:id/shortlink', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const shortCode = db.generateShortLink(req.params.id);
  if (!shortCode) {
    return res.status(404).json({ error: 'Snippet not found' });
  }
  res.json({ shortCode, shortLink: `/s/${shortCode}` });
});

app.get('/s/:shortCode', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const snippet = db.getSnippetByShortCode(req.params.shortCode);
  if (!snippet) {
    return res.status(404).json({ error: 'Snippet not found' });
  }
  res.json({ redirect: `/snippet/${snippet.id}`, snippet });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
