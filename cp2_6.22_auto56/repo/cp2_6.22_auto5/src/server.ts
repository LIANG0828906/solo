import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Snippet, Expiration } from './types.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

let snippets: Snippet[] = [];

function generateShareId(): string {
  return uuidv4().slice(0, 8);
}

function cleanupExpired() {
  const now = Date.now();
  snippets = snippets.filter((s) => s.expiresAt === null || s.expiresAt > now);
}

setInterval(cleanupExpired, 60 * 1000);

app.get('/api/snippets', (_req, res) => {
  cleanupExpired();
  res.json(snippets);
});

app.get('/api/snippets/share/:shareId', (req, res) => {
  cleanupExpired();
  const snippet = snippets.find((s) => s.shareId === req.params.shareId);
  if (!snippet) {
    res.status(404).json({ error: '片段未找到或已过期' });
    return;
  }
  res.json(snippet);
});

app.post('/api/snippets', (req, res) => {
  const { title, content, language, expiration } = req.body as {
    title: string;
    content: string;
    language: string;
    expiration: Expiration;
  };

  let expiresAt: number | null = null;
  switch (expiration) {
    case '1h': expiresAt = Date.now() + 60 * 60 * 1000; break;
    case '24h': expiresAt = Date.now() + 24 * 60 * 60 * 1000; break;
    case '7d': expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; break;
    case 'never': expiresAt = null; break;
    default: expiresAt = null;
  }

  const snippet: Snippet = {
    id: uuidv4(),
    title: title || '未命名片段',
    content: content || '',
    language: language || 'javascript',
    createdAt: Date.now(),
    expiresAt,
    favorite: false,
    shareId: generateShareId(),
  };

  snippets.unshift(snippet);
  res.status(201).json(snippet);
});

app.patch('/api/snippets/:id', (req, res) => {
  const idx = snippets.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '片段未找到' });
    return;
  }

  const updates = req.body as Partial<Pick<Snippet, 'title' | 'content' | 'language' | 'favorite'>>;

  if (updates.title !== undefined) snippets[idx].title = updates.title;
  if (updates.content !== undefined) snippets[idx].content = updates.content;
  if (updates.language !== undefined) snippets[idx].language = updates.language;
  if (updates.favorite !== undefined) snippets[idx].favorite = updates.favorite;

  res.json(snippets[idx]);
});

app.delete('/api/snippets/:id', (req, res) => {
  const idx = snippets.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '片段未找到' });
    return;
  }
  snippets.splice(idx, 1);
  res.status(204).end();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
