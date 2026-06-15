import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Project {
  id: string;
  title: string;
  targetWordCount: number;
  deadline: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface WritingLog {
  id: string;
  projectId: string;
  date: string;
  wordsAdded: number;
  snippets: string[];
  createdAt: string;
}

interface DatabaseSchema {
  projects: Project[];
  chapters: Chapter[];
  writingLogs: WritingLog[];
}

const defaultData: DatabaseSchema = {
  projects: [],
  chapters: [],
  writingLogs: [],
};

const dbPath = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFile<DatabaseSchema>(dbPath);
const db = new Low<DatabaseSchema>(adapter, defaultData);
await db.read();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'writing-assistant-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);

function now(): string {
  return new Date().toISOString();
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' });
});

app.get('/api/projects', (_req: Request, res: Response) => {
  res.json([...db.data.projects].sort((a, b) => a.order - b.order));
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const p = db.data.projects.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'Project not found' });
  res.json(p);
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { title, targetWordCount, deadline, tags } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'title required' });
  const maxOrder = db.data.projects.reduce((m, p) => Math.max(m, p.order), -1);
  const project: Project = {
    id: uuidv4(),
    title: String(title),
    targetWordCount: Number(targetWordCount) || 0,
    deadline: String(deadline || ''),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  db.data.projects.push(project);
  db.write();
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const idx = db.data.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Project not found' });
  const { title, targetWordCount, deadline, tags } = req.body;
  const patch: Partial<Project> = {};
  if (title !== undefined) patch.title = String(title);
  if (targetWordCount !== undefined) patch.targetWordCount = Number(targetWordCount);
  if (deadline !== undefined) patch.deadline = String(deadline);
  if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags.map(String) : [];
  db.data.projects[idx] = { ...db.data.projects[idx], ...patch, updatedAt: now() };
  db.write();
  res.json(db.data.projects[idx]);
});

app.post('/api/projects/:id/duplicate', (req: Request, res: Response) => {
  const p = db.data.projects.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'Project not found' });
  const chapters = db.data.chapters.filter(c => c.projectId === req.params.id);
  const newId = uuidv4();
  const maxOrder = db.data.projects.reduce((m, pr) => Math.max(m, pr.order), -1);
  const newProject: Project = {
    ...p,
    id: newId,
    title: `${p.title} (副本)`,
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  db.data.projects.push(newProject);
  for (const ch of chapters) {
    db.data.chapters.push({
      id: uuidv4(),
      projectId: newId,
      title: ch.title,
      content: ch.content,
      order: ch.order,
      createdAt: now(),
      updatedAt: now(),
    });
  }
  db.write();
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const idx = db.data.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Project not found' });
  db.data.projects.splice(idx, 1);
  db.data.chapters = db.data.chapters.filter(c => c.projectId !== req.params.id);
  db.data.writingLogs = db.data.writingLogs.filter(l => l.projectId !== req.params.id);
  db.write();
  res.json({ success: true });
});

app.put('/api/projects/reorder', (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids)) return res.status(400).json({ success: false, error: 'ids array required' });
  const map = new Map(ids.map((id, i) => [id, i]));
  for (const p of db.data.projects) {
    if (map.has(p.id)) p.order = map.get(p.id)!;
  }
  db.write();
  res.json([...db.data.projects].sort((a, b) => a.order - b.order));
});

app.get('/api/projects/:id/chapters', (req: Request, res: Response) => {
  res.json(
    db.data.chapters
      .filter(c => c.projectId === req.params.id)
      .sort((a, b) => a.order - b.order),
  );
});

app.post('/api/projects/:id/chapters', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'title required' });
  const projectChapters = db.data.chapters.filter(c => c.projectId === req.params.id);
  const maxOrder = projectChapters.reduce((m, c) => Math.max(m, c.order), -1);
  const chapter: Chapter = {
    id: uuidv4(),
    projectId: req.params.id,
    title: String(title),
    content: '',
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  db.data.chapters.push(chapter);
  db.write();
  res.status(201).json(chapter);
});

app.put('/api/chapters/:id', (req: Request, res: Response) => {
  const idx = db.data.chapters.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Chapter not found' });
  const { title, content } = req.body;
  const patch: Partial<Chapter> = {};
  if (title !== undefined) patch.title = String(title);
  if (content !== undefined) patch.content = String(content);
  db.data.chapters[idx] = { ...db.data.chapters[idx], ...patch, updatedAt: now() };
  db.write();
  res.json(db.data.chapters[idx]);
});

app.delete('/api/chapters/:id', (req: Request, res: Response) => {
  const idx = db.data.chapters.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Chapter not found' });
  db.data.chapters.splice(idx, 1);
  db.write();
  res.json({ success: true });
});

app.put('/api/projects/:id/chapters/reorder', (req: Request, res: Response) => {
  const { chapterIds } = req.body as { chapterIds: string[] };
  if (!Array.isArray(chapterIds)) return res.status(400).json({ success: false, error: 'chapterIds array required' });
  const map = new Map(chapterIds.map((id, i) => [id, i]));
  for (const c of db.data.chapters) {
    if (c.projectId === req.params.id && map.has(c.id)) c.order = map.get(c.id)!;
  }
  db.write();
  res.json(
    db.data.chapters
      .filter(c => c.projectId === req.params.id)
      .sort((a, b) => a.order - b.order),
  );
});

app.post('/api/writing-logs', (req: Request, res: Response) => {
  const { projectId, date, wordsAdded, snippets } = req.body;
  if (!projectId || !date) return res.status(400).json({ success: false, error: 'projectId and date required' });
  const log: WritingLog = {
    id: uuidv4(),
    projectId: String(projectId),
    date: String(date),
    wordsAdded: Number(wordsAdded) || 0,
    snippets: Array.isArray(snippets) ? snippets.map(String) : [],
    createdAt: now(),
  };
  db.data.writingLogs.push(log);
  db.write();
  res.status(201).json(log);
});

app.get('/api/writing-logs/:projectId/daily', (req: Request, res: Response) => {
  const days = Number(req.query.days) || 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  res.json(db.data.writingLogs.filter(l => l.projectId === req.params.projectId && l.date >= cutoffStr));
});

app.get('/api/writing-logs/:projectId/date/:date', (req: Request, res: Response) => {
  const log = db.data.writingLogs.find(
    l => l.projectId === req.params.projectId && l.date === req.params.date,
  );
  if (!log) return res.status(404).json({ success: false, error: 'Log not found' });
  res.json(log);
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
