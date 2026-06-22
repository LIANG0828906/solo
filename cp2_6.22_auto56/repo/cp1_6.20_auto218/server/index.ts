import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { scriptOperations, versionOperations } from './db.js';
import type { Script, Version, DiffResult } from './types.js';
import { computeDiff } from './utils/diff.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

interface CursorPosition {
  userId: string;
  userName: string;
  scriptId: string;
  line: number;
  column: number;
}

const activeUsers = new Map<string, Set<string>>();
const cursorPositions = new Map<string, CursorPosition>();

app.get('/api/scripts', async (_req: Request, res: Response<{ success: boolean; data?: Script[]; error?: string }>) => {
  const scripts = await scriptOperations.getAll();
  res.json({ success: true, data: scripts });
});

app.post('/api/scripts', async (req: Request, res: Response<{ success: boolean; data?: Script; error?: string }>) => {
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400).json({ success: false, error: '标题和内容是必填项' });
    return;
  }
  const newScript = await scriptOperations.create({
    title,
    content,
  });
  res.status(201).json({ success: true, data: newScript });
});

app.get('/api/scripts/:id', async (req: Request, res: Response<{ success: boolean; data?: Script; error?: string }>) => {
  const { id } = req.params;
  const script = await scriptOperations.getById(id);
  if (!script) {
    res.status(404).json({ success: false, error: '剧本不存在' });
    return;
  }
  res.json({ success: true, data: script });
});

app.put('/api/scripts/:id', async (req: Request, res: Response<{ success: boolean; data?: Script; error?: string }>) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const updatedScript = await scriptOperations.update(id, { title, content });
  if (!updatedScript) {
    res.status(404).json({ success: false, error: '剧本不存在' });
    return;
  }
  res.json({ success: true, data: updatedScript });
});

app.get('/api/scripts/:id/versions', async (req: Request, res: Response<{ success: boolean; data?: Version[]; error?: string }>) => {
  const { id } = req.params;
  const versions = await versionOperations.getByScriptId(id);
  res.json({ success: true, data: versions });
});

app.post('/api/scripts/:id/versions', async (req: Request, res: Response<{ success: boolean; data?: Version; error?: string }>) => {
  const { id } = req.params;
  const { content, author } = req.body;
  if (!content) {
    res.status(400).json({ success: false, error: '内容是必填项' });
    return;
  }
  const newVersion = await versionOperations.create(id, {
    content,
    author: author || '未知用户',
  });
  if (!newVersion) {
    res.status(404).json({ success: false, error: '剧本不存在' });
    return;
  }
  res.status(201).json({ success: true, data: newVersion });
});

app.get('/api/scripts/:id/versions/:versionId', async (req: Request, res: Response<{ success: boolean; data?: Version; error?: string }>) => {
  const { id, versionId } = req.params;
  const version = await versionOperations.getById(id, versionId);
  if (!version) {
    res.status(404).json({ success: false, error: '版本不存在' });
    return;
  }
  res.json({ success: true, data: version });
});

app.post('/api/scripts/:id/diff', async (req: Request, res: Response<{ success: boolean; data?: DiffResult; error?: string }>) => {
  const { version1Id, version2Id } = req.body;
  const { id } = req.params;

  if (!version1Id || !version2Id) {
    res.status(400).json({ success: false, error: '需要提供 version1Id 和 version2Id' });
    return;
  }

  const version1 = await versionOperations.getById(id, version1Id);
  const version2 = await versionOperations.getById(id, version2Id);

  if (!version1 || !version2) {
    res.status(404).json({ success: false, error: '版本不存在' });
    return;
  }

  const diffResult = computeDiff(version1.content, version2.content);
  res.json({ success: true, data: diffResult });
});

io.on('connection', (socket) => {
  socket.on('join', ({ scriptId, userId, userName }: { scriptId: string; userId: string; userName: string }) => {
    socket.join(scriptId);
    
    if (!activeUsers.has(scriptId)) {
      activeUsers.set(scriptId, new Set());
    }
    activeUsers.get(scriptId)!.add(userId);

    const users = Array.from(activeUsers.get(scriptId) || []);
    io.to(scriptId).emit('userJoined', { userId, userName, users });
    
    const cursors = Array.from(cursorPositions.values()).filter((c) => c.scriptId === scriptId);
    socket.emit('cursors', cursors);
  });

  socket.on('leave', ({ scriptId, userId, userName }: { scriptId: string; userId: string; userName: string }) => {
    socket.leave(scriptId);
    
    if (activeUsers.has(scriptId)) {
      activeUsers.get(scriptId)!.delete(userId);
      if (activeUsers.get(scriptId)!.size === 0) {
        activeUsers.delete(scriptId);
      }
    }
    
    cursorPositions.delete(userId);
    
    const users = Array.from(activeUsers.get(scriptId) || []);
    io.to(scriptId).emit('userLeft', { userId, userName, users });
    io.to(scriptId).emit('cursorRemoved', { userId });
  });

  socket.on('edit', ({ scriptId, content, userId }: { scriptId: string; content: string; userId: string }) => {
    socket.to(scriptId).emit('edit', { content, userId });
  });

  socket.on('cursor', ({ userId, userName, scriptId, line, column }: CursorPosition) => {
    cursorPositions.set(userId, { userId, userName, scriptId, line, column });
    socket.to(scriptId).emit('cursor', { userId, userName, line, column });
  });

  socket.on('disconnect', () => {
    for (const [scriptId, users] of activeUsers.entries()) {
      for (const userId of users) {
        if (socket.id.includes(userId)) {
          users.delete(userId);
          cursorPositions.delete(userId);
          io.to(scriptId).emit('userLeft', { userId, users: Array.from(users) });
          io.to(scriptId).emit('cursorRemoved', { userId });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;