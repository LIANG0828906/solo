import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { taskStore, TaskPriority, TaskStatus } from './taskStore';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = 3001;

app.use(express.json());

app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(taskStore.getTasks());
});

let onlineCount = 0;

const broadcastOnlineCount = () => {
  io.emit('online:count', onlineCount);
};

io.on('connection', (socket: Socket) => {
  onlineCount++;
  broadcastOnlineCount();

  socket.on(
    'task:create',
    (data: { title: string; assignee: string; priority: TaskPriority }) => {
      if (!data.title?.trim() || !data.assignee?.trim()) {
        return;
      }
      const validPriorities: TaskPriority[] = ['high', 'medium', 'low'];
      const priority = validPriorities.includes(data.priority) ? data.priority : 'medium';
      const newTask = taskStore.addTask({
        title: data.title.trim(),
        assignee: data.assignee.trim(),
        priority,
      });
      io.emit('task:created', newTask);
    }
  );

  socket.on(
    'task:move',
    (data: { taskId: string; newStatus: TaskStatus }) => {
      const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
      if (!data.taskId || !validStatuses.includes(data.newStatus)) {
        return;
      }
      const updatedTask = taskStore.updateTaskStatus(data.taskId, data.newStatus);
      if (updatedTask) {
        io.emit('task:moved', { taskId: data.taskId, newStatus: data.newStatus });
      }
    }
  );

  socket.on('task:delete', (data: { taskId: string }) => {
    if (!data.taskId) {
      return;
    }
    const deleted = taskStore.deleteTask(data.taskId);
    if (deleted) {
      io.emit('task:deleted', { taskId: data.taskId });
    }
  });

  socket.on('disconnect', () => {
    onlineCount--;
    broadcastOnlineCount();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
