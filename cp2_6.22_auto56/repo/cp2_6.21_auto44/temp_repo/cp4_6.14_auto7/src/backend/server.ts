import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import db, { CodeSnippet } from './db';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const simulateDelay = (ms: number = 100): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

interface ApiError {
  error: string;
  code?: string;
}

const sendError = (res: Response, status: number, message: string, code?: string) => {
  const body: ApiError = { error: message };
  if (code) body.code = code;
  res.status(status).json(body);
};

const safeString = (value: unknown, maxLen: number = 1000): string => {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLen);
};

const safeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map((t) => t.slice(0, 50))
      .filter(Boolean)
      .slice(0, 10);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((t) => t.trim().slice(0, 50))
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
};

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/snippets', async (req: Request, res: Response) => {
  await simulateDelay(100);

  const page = parseInt(safeString(req.query.page, 10)) || undefined;
  const pageSize = parseInt(safeString(req.query.pageSize, 10)) || undefined;

  const result = db.getAll(page, pageSize);
  res.json(result);
});

app.get('/api/snippets/search', async (req: Request, res: Response) => {
  await simulateDelay(100);

  const keyword = safeString(req.query.keyword, 200);
  const tags = safeTags(req.query.tags);
  const page = parseInt(safeString(req.query.page, 10)) || undefined;
  const pageSize = parseInt(safeString(req.query.pageSize, 10)) || undefined;

  const result = db.search(keyword, tags, page, pageSize);
  res.json(result);
});

app.get('/api/snippets/:id', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const id = safeString(req.params.id, 100);
  if (!id) {
    return sendError(res, 400, 'Invalid snippet id', 'INVALID_ID');
  }

  const snippet = db.getById(id);
  if (!snippet) {
    return sendError(res, 404, 'Snippet not found', 'NOT_FOUND');
  }
  res.json(snippet);
});

app.post('/api/snippets', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const body = req.body || {};
  const title = safeString(body.title, 200).trim();
  const description = safeString(body.description, 2000);
  const code = safeString(body.code, 100000);
  const language = safeString(body.language, 50).trim();
  const tags = safeTags(body.tags).slice(0, 3);

  if (!title) {
    return sendError(res, 400, 'Title is required', 'MISSING_TITLE');
  }
  if (!code) {
    return sendError(res, 400, 'Code is required', 'MISSING_CODE');
  }
  if (!language) {
    return sendError(res, 400, 'Language is required', 'MISSING_LANGUAGE');
  }
  if (tags.length > 3) {
    return sendError(res, 400, 'Maximum 3 tags allowed', 'MAX_TAGS_EXCEEDED');
  }

  const snippet = db.create({ title, description, code, language, tags });
  res.status(201).json(snippet);
});

app.put('/api/snippets/:id', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const id = safeString(req.params.id, 100);
  if (!id) {
    return sendError(res, 400, 'Invalid snippet id', 'INVALID_ID');
  }

  const body = req.body || {};
  const update: Partial<{
    title: string;
    description: string;
    code: string;
    language: string;
    tags: string[];
  }> = {};

  if (body.title !== undefined) {
    const title = safeString(body.title, 200).trim();
    if (!title) {
      return sendError(res, 400, 'Title cannot be empty', 'EMPTY_TITLE');
    }
    update.title = title;
  }
  if (body.description !== undefined) {
    update.description = safeString(body.description, 2000);
  }
  if (body.code !== undefined) {
    const code = safeString(body.code, 100000);
    if (!code) {
      return sendError(res, 400, 'Code cannot be empty', 'EMPTY_CODE');
    }
    update.code = code;
  }
  if (body.language !== undefined) {
    const language = safeString(body.language, 50).trim();
    if (!language) {
      return sendError(res, 400, 'Language cannot be empty', 'EMPTY_LANGUAGE');
    }
    update.language = language;
  }
  if (body.tags !== undefined) {
    const tags = safeTags(body.tags).slice(0, 3);
    update.tags = tags;
  }

  const snippet = db.update(id, update);
  if (!snippet) {
    return sendError(res, 404, 'Snippet not found', 'NOT_FOUND');
  }
  res.json(snippet);
});

app.delete('/api/snippets/:id', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const id = safeString(req.params.id, 100);
  if (!id) {
    return sendError(res, 400, 'Invalid snippet id', 'INVALID_ID');
  }

  const deleted = db.delete(id);
  if (!deleted) {
    return sendError(res, 404, 'Snippet not found', 'NOT_FOUND');
  }
  res.json({ message: 'Snippet deleted' });
});

app.post('/api/snippets/:id/favorite', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const id = safeString(req.params.id, 100);
  if (!id) {
    return sendError(res, 400, 'Invalid snippet id', 'INVALID_ID');
  }

  const nonce = safeString(req.body?.nonce, 100) || undefined;

  const result = db.toggleFavorite(id, nonce);
  if (!result) {
    return sendError(res, 404, 'Snippet not found', 'NOT_FOUND');
  }
  res.json(result);
});

app.get('/api/tags', async (_req: Request, res: Response) => {
  await simulateDelay(30);
  const tags = db.getAvailableTags();
  res.json(tags);
});

app.post('/api/snippets/:id/shortlink', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const id = safeString(req.params.id, 100);
  if (!id) {
    return sendError(res, 400, 'Invalid snippet id', 'INVALID_ID');
  }

  const shortCode = db.generateShortLink(id);
  if (!shortCode) {
    return sendError(res, 404, 'Snippet not found', 'NOT_FOUND');
  }
  res.json({ shortCode, shortLink: `/s/${shortCode}` });
});

app.get('/s/:shortCode', async (req: Request, res: Response) => {
  await simulateDelay(50);

  const shortCode = safeString(req.params.shortCode, 50);
  if (!shortCode) {
    return sendError(res, 400, 'Invalid short code', 'INVALID_SHORTCODE');
  }

  const snippet = db.getSnippetByShortCode(shortCode);
  if (!snippet) {
    return sendError(res, 404, 'Snippet not found', 'NOT_FOUND');
  }
  res.json({ redirect: `/snippet/${snippet.id}`, snippet });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
