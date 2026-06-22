import express, { type Request, type Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { db } from './db.js';
import type { Task, Comment, ActivityLog, SwimLane, Board } from './models.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const teamId = 'team-001';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username } = req.body;
  const user = await db.getUserByUsername(username);
  if (user) {
    res.json({ success: true, user, token: 'mock-token-' + user.id });
  } else {
    res.status(401).json({ success: false, error: '用户不存在' });
  }
});

app.get('/api/users', async (_req: Request, res: Response) => {
  const users = await db.getUsersByTeam(teamId);
  res.json({ success: true, users });
});

app.post('/api/users', async (req: Request, res: Response) => {
  const { username, role } = req.body;
  const newUser = {
    id: generateId('user'),
    username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    role: role || 'member',
    teamId,
  };
  await db.addUser(newUser);
  io.emit('member:added', { user: newUser });
  io.emit('notification', { type: 'member', message: `${newUser.username} 加入了团队` });
  res.json({ success: true, user: newUser });
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await db.getUserById(id);
  if (user) {
    await db.removeUser(id);
    io.emit('member:removed', { userId: id });
    io.emit('notification', { type: 'member', message: `${user.username} 离开了团队` });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: '用户不存在' });
  }
});

app.get('/api/boards', async (_req: Request, res: Response) => {
  const boards = await db.getBoardsByTeam(teamId);
  res.json({ success: true, boards });
});

app.get('/api/boards/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const board = await db.getBoardById(id);
  if (!board) {
    res.status(404).json({ success: false, error: '看板不存在' });
    return;
  }
  const swimLanes = await db.getSwimLanesByBoard(id);
  const tasks = await db.getTasksByBoard(id);
  res.json({ success: true, board: { ...board, swimLanes, tasks } });
});

app.post('/api/boards', async (req: Request, res: Response) => {
  const { name, swimLanes } = req.body;
  const boardId = generateId('board');
  const newBoard: Board = {
    id: boardId,
    name,
    teamId,
    swimLanes: [],
  };
  await db.addBoard(newBoard);
  
  const defaultLanes = swimLanes || [
    { name: '待办', order: 0 },
    { name: '进行中', order: 1 },
    { name: '评审', order: 2 },
    { name: '已完成', order: 3 },
  ];
  
  const createdLanes: SwimLane[] = [];
  for (const lane of defaultLanes) {
    const newLane: SwimLane = {
      id: generateId('lane'),
      name: lane.name,
      boardId,
      order: lane.order,
    };
    await db.addSwimLane(newLane);
    createdLanes.push(newLane);
  }
  
  const boardWithLanes = { ...newBoard, swimLanes: createdLanes, tasks: [] };
  io.emit('board:created', { board: boardWithLanes });
  io.emit('notification', { type: 'board', message: `创建了新看板「${name}」` });
  res.json({ success: true, board: boardWithLanes });
});

app.put('/api/boards/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, swimLanes } = req.body;
  const updated = await db.updateBoard(id, { name });
  if (!updated) {
    res.status(404).json({ success: false, error: '看板不存在' });
    return;
  }
  if (swimLanes && Array.isArray(swimLanes)) {
    const existingLanes = await db.getSwimLanesByBoard(id);
    for (const lane of existingLanes) {
      await db.deleteSwimLane(lane.id);
    }
    for (let i = 0; i < swimLanes.length; i++) {
      const laneData = swimLanes[i];
      const newLane: SwimLane = {
        id: laneData.id || generateId('lane'),
        name: laneData.name,
        boardId: id,
        order: i,
      };
      await db.addSwimLane(newLane);
    }
  }
  const board = await db.getBoardById(id);
  const updatedLanes = await db.getSwimLanesByBoard(id);
  const tasks = await db.getTasksByBoard(id);
  const result = { ...board, swimLanes: updatedLanes, tasks };
  io.emit('board:updated', { board: result });
  io.emit('notification', { type: 'board', message: `看板「${name || updated.name}」已更新` });
  res.json({ success: true, board: result });
});

app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const oldTask = await db.getTaskById(id);
  if (!oldTask) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  const updated = await db.updateTask(id, data);
  if (!updated) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  
  let action = '更新任务';
  let details = '更新了任务信息';
  if (data.swimLaneId && data.swimLaneId !== oldTask.swimLaneId) {
    const lanes = await db.getSwimLanesByBoard(oldTask.boardId);
    const oldLane = lanes.find(l => l.id === oldTask.swimLaneId);
    const newLane = lanes.find(l => l.id === data.swimLaneId);
    action = '移动泳道';
    details = `从「${oldLane?.name || '未知'}」移动到「${newLane?.name || '未知'}」`;
  }
  
  const log: ActivityLog = {
    id: generateId('log'),
    taskId: id,
    userId: data.userId || 'user-001',
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  await db.addActivityLog(log);
  
  const taskDetail = {
    ...updated,
    comments: await db.getCommentsByTask(id),
    activityLogs: await db.getActivityLogsByTask(id),
    attachments: await db.getAttachmentsByTask(id),
  };
  
  io.emit('task:updated', { task: taskDetail });
  res.json({ success: true, task: taskDetail });
});

app.get('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await db.getTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  const comments = await db.getCommentsByTask(id);
  const activityLogs = await db.getActivityLogsByTask(id);
  const attachments = await db.getAttachmentsByTask(id);
  res.json({ success: true, task: { ...task, comments, activityLogs, attachments } });
});

app.post('/api/tasks/:id/comments', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, content } = req.body;
  const task = await db.getTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  const comment: Comment = {
    id: generateId('comment'),
    taskId: id,
    userId,
    content,
    createdAt: new Date().toISOString(),
  };
  await db.addComment(comment);
  
  const user = await db.getUserById(userId);
  const log: ActivityLog = {
    id: generateId('log'),
    taskId: id,
    userId,
    action: '添加评论',
    details: `${user?.username || '未知用户'} 添加了评论`,
    createdAt: new Date().toISOString(),
  };
  await db.addActivityLog(log);
  
  io.emit('task:comment:added', { taskId: id, comment });
  res.json({ success: true, comment });
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  const { title, description, priority, assigneeId, dueDate, swimLaneId, boardId, userId } = req.body;
  const newTask: Task = {
    id: generateId('task'),
    title,
    description: description || '',
    priority: priority || 'medium',
    assigneeId,
    dueDate,
    swimLaneId,
    boardId,
    createdAt: new Date().toISOString(),
  };
  await db.addTask(newTask);
  
  const log: ActivityLog = {
    id: generateId('log'),
    taskId: newTask.id,
    userId: userId || 'user-001',
    action: '创建任务',
    details: `创建了任务「${title}」`,
    createdAt: new Date().toISOString(),
  };
  await db.addActivityLog(log);
  
  const taskDetail = {
    ...newTask,
    comments: [],
    activityLogs: [log],
    attachments: [],
  };
  
  io.emit('task:created', { task: taskDetail });
  io.emit('notification', { type: 'task', message: `创建了新任务「${title}」` });
  res.json({ success: true, task: taskDetail });
});

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await db.getTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  await db.deleteTask(id);
  io.emit('task:deleted', { taskId: id, boardId: task.boardId });
  res.json({ success: true });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join', (boardId: string) => {
    socket.join(boardId);
    console.log(`Socket ${socket.id} joined board ${boardId}`);
  });
  
  socket.on('leave', (boardId: string) => {
    socket.leave(boardId);
    console.log(`Socket ${socket.id} left board ${boardId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`WebSocket ready on port ${PORT}`);
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
