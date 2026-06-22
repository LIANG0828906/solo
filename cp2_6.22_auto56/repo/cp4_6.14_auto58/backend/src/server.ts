import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { store } from './store';
import type { DiffSegment } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/document', (_req: Request, res: Response) => {
  const doc = store.getDocument();
  res.json(doc);
});

app.put('/api/document', (req: Request, res: Response) => {
  try {
    const { content, updatedBy } = req.body as { content: string; updatedBy?: string };
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    const updatedDoc = store.updateDocument(content, updatedBy);
    res.json(updatedDoc);
  } catch {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

app.get('/api/comments', (_req: Request, res: Response) => {
  const comments = store.getComments();
  res.json(comments);
});

app.post('/api/comments', (req: Request, res: Response) => {
  try {
    const { text, startOffset, endOffset, content, author } = req.body as {
      text: string;
      startOffset: number;
      endOffset: number;
      content: string;
      author?: string;
    };
    if (text === undefined || startOffset === undefined || endOffset === undefined || content === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const comment = store.addComment(text, startOffset, endOffset, content, author);
    res.status(201).json(comment);
  } catch {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

app.post('/api/comments/:id/replies', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, author } = req.body as { content: string; author?: string };
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    const reply = store.addCommentReply(id, content, author);
    if (!reply) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    res.status(201).json(reply);
  } catch {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

app.put('/api/comments/:id/resolve', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolvedBy } = req.body as { resolvedBy?: string };
    const comment = store.resolveComment(id, resolvedBy);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    res.json(comment);
  } catch {
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

app.get('/api/versions', (_req: Request, res: Response) => {
  const versions = store.getVersions();
  res.json(versions);
});

app.post('/api/versions', (req: Request, res: Response) => {
  try {
    const { createdBy, description } = req.body as { createdBy?: string; description?: string };
    const version = store.addVersion(createdBy, description);
    res.status(201).json(version);
  } catch {
    res.status(500).json({ error: 'Failed to create version' });
  }
});

app.get('/api/versions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const version = store.getVersionById(id);
  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  res.json(version);
});

app.get('/api/versions/diff', (req: Request, res: Response) => {
  try {
    const { baseId, targetId } = req.query as { baseId?: string; targetId?: string };
    if (!baseId || !targetId) {
      res.status(400).json({ error: 'baseId and targetId are required' });
      return;
    }
    const baseVersion = store.getVersionById(baseId);
    const targetVersion = store.getVersionById(targetId);
    if (!baseVersion || !targetVersion) {
      res.status(404).json({ error: 'One or both versions not found' });
      return;
    }
    const diff: DiffSegment[] = store.computeDiff(baseVersion.plainText, targetVersion.plainText);
    res.json({
      baseId,
      targetId,
      diff,
    });
  } catch {
    res.status(500).json({ error: 'Failed to compute diff' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
