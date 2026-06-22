import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Task, ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let tasks: Task[] = [];
let onlineUsers = 0;

const MAX_TASKS = 50;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('users:count', onlineUsers);
  io.emit('notification', '新用户加入了看板');

  socket.emit('tasks:initial', tasks);

  socket.on('task:create', (taskData) => {
    if (tasks.length >= MAX_TASKS) {
      return;
    }
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: Date.now()
    };
    tasks.push(newTask);
    io.emit('task:created', newTask);
  });

  socket.on('task:update', (updatedTask) => {
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      io.emit('task:updated', updatedTask);
    }
  });

  socket.on('task:delete', (taskId) => {
    tasks = tasks.filter(t => t.id !== taskId);
    io.emit('task:deleted', taskId);
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('users:count', onlineUsers);
    io.emit('notification', '有用户离开了看板');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`任务编织者服务器运行在 http://localhost:${PORT}`);
});
