import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
  reorderProjects,
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  createWritingLog,
  getDailyWritingLogs,
  getWritingLogByDate,
} from './db.js';
import type { Project, Chapter, WritingLog } from '../shared/types.js';

dotenv.config();

const app: express.Application = express();

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

// projects
app.get('/api/projects', (_req: Request, res: Response) => {
  res.json(getProjects());
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const p = getProject(req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'Project not found' });
  res.json(p);
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { title, targetWordCount, deadline, tags } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'title required' });
  const project: Project = {
    id: uuidv4(),
    title: String(title),
    targetWordCount: Number(targetWordCount) || 0,
    deadline: String(deadline || ''),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  res.status(201).json(createProject(project));
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const { title, targetWordCount, deadline, tags } = req.body;
  const patch: Partial<Project> = {};
  if (title !== undefined) patch.title = String(title);
  if (targetWordCount !== undefined) patch.targetWordCount = Number(targetWordCount);
  if (deadline !== undefined) patch.deadline = String(deadline);
  if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags.map(String) : [];
  const p = updateProject(req.params.id, patch);
  if (!p) return res.status(404).json({ success: false, error: 'Project not found' });
  res.json(p);
});

app.post('/api/projects/:id/duplicate', (req: Request, res: Response) => {
  const p = duplicateProject(req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'Project not found' });
  res.status(201).json(p);
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const ok = deleteProject(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Project not found' });
  res.json({ success: true });
});

app.put('/api/projects/reorder', (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids)) return res.status(400).json({ success: false, error: 'ids array required' });
  res.json(reorderProjects(ids));
});

// chapters
app.get('/api/projects/:id/chapters', (req: Request, res: Response) => {
  res.json(getChapters(req.params.id));
});

app.post('/api/projects/:id/chapters', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'title required' });
  const chapter: Chapter = {
    id: uuidv4(),
    projectId: req.params.id,
    title: String(title),
    content: '',
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  res.status(201).json(createChapter(chapter));
});

app.put('/api/chapters/:id', (req: Request, res: Response) => {
  const { title, content } = req.body;
  const patch: Partial<Chapter> = {};
  if (title !== undefined) patch.title = String(title);
  if (content !== undefined) patch.content = String(content);
  const c = updateChapter(req.params.id, patch);
  if (!c) return res.status(404).json({ success: false, error: 'Chapter not found' });
  res.json(c);
});

app.delete('/api/chapters/:id', (req: Request, res: Response) => {
  const ok = deleteChapter(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Chapter not found' });
  res.json({ success: true });
});

app.put('/api/projects/:id/chapters/reorder', (req: Request, res: Response) => {
  const { chapterIds } = req.body as { chapterIds: string[] };
  if (!Array.isArray(chapterIds)) return res.status(400).json({ success: false, error: 'chapterIds array required' });
  res.json(reorderChapters(req.params.id, chapterIds));
});

// writing logs
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
  res.status(201).json(createWritingLog(log));
});

app.get('/api/writing-logs/:projectId/daily', (req: Request, res: Response) => {
  const days = Number(req.query.days) || 7;
  res.json(getDailyWritingLogs(req.params.projectId, days));
});

app.get('/api/writing-logs/:projectId/date/:date', (req: Request, res: Response) => {
  const log = getWritingLogByDate(req.params.projectId, req.params.date);
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

export default app;
