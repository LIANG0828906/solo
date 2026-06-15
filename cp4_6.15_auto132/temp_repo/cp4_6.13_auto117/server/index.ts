import express, {
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from 'express';
import http from 'http';
import cors from 'cors';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  exportData,
} from './taskData.js';
import { setupWebSocket, broadcast } from './websocket.js';
import type { TaskCreateInput, TaskUpdateInput } from '../src/types/index.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  });
});

app.get('/api/tasks', (_req: Request, res: Response, _next: NextFunction): void => {
  try {
    const tasks = getAllTasks();
    res.status(200).json(tasks);
  } catch (error) {
    _next(error);
  }
});

app.post('/api/tasks', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const body = req.body as TaskCreateInput;
    if (!body.title || typeof body.title !== 'string') {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }
    const newTask = createTask({
      title: body.title,
      description: body.description ?? '',
      estimatedHours: body.estimatedHours ?? 0,
      assignees: body.assignees ?? [],
    });
    broadcast('TASK_CREATED', newTask);
    res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
});

app.put('/api/tasks/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const body = req.body as TaskUpdateInput;
    const updated = updateTask(id, body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    broadcast('TASK_UPDATED', updated);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/tasks/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const deleted = deleteTask(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    broadcast('TASK_DELETED', id);
    res.status(200).json({ success: true, id });
  } catch (error) {
    next(error);
  }
});

app.get('/api/export', (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const data = exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="teamtime-export.json"');
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

const errorHandler: ErrorRequestHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('[Server] Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
};
app.use(errorHandler);

app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

const server = http.createServer(app);

setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`[Server] HTTP & WebSocket server listening on port ${PORT}`);
  console.log(`[Server] REST API: http://localhost:${PORT}/api/`);
  console.log(`[Server] WebSocket: ws://localhost:${PORT}/ws`);
});

const SNAPSHOT_INTERVAL_MS = 30_000;
setInterval(() => {
  try {
    const tasks = getAllTasks();
    broadcast('SNAPSHOT', tasks);
    console.log(`[Server] Broadcasted SNAPSHOT with ${tasks.length} tasks`);
  } catch (error) {
    console.error('[Server] Failed to broadcast SNAPSHOT:', error);
  }
}, SNAPSHOT_INTERVAL_MS);

function shutdown(signal: string): void {
  console.log(`[Server] ${signal} signal received, shutting down...`);
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
