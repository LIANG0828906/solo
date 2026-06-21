import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in-progress' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  status: TaskStatus;
  storyPoints: number;
  order: number;
  createdAt: Date;
  completedAt?: Date;
}

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  connectedAt: Date;
}

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: Date;
}

let tasks: Task[] = [
  {
    id: uuidv4(),
    title: '用户登录模块开发',
    description: '实现用户登录、注册和密码找回功能',
    priority: 'high',
    assignee: '张三',
    status: 'todo',
    storyPoints: 8,
    order: 0,
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '首页布局设计',
    description: '完成首页的整体布局和样式设计',
    priority: 'medium',
    assignee: '李四',
    status: 'todo',
    storyPoints: 5,
    order: 1,
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '数据接口对接',
    description: '完成与后端API的数据对接工作',
    priority: 'high',
    assignee: '王五',
    status: 'in-progress',
    storyPoints: 13,
    order: 0,
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '单元测试编写',
    description: '为核心模块编写单元测试用例',
    priority: 'low',
    assignee: '赵六',
    status: 'in-progress',
    storyPoints: 3,
    order: 1,
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '项目初始化',
    description: '完成项目基础架构搭建和依赖配置',
    priority: 'medium',
    assignee: '张三',
    status: 'done',
    storyPoints: 5,
    order: 0,
    createdAt: new Date(Date.now() - 86400000 * 2),
    completedAt: new Date(Date.now() - 86400000),
  },
];

let sprint: Sprint = {
  id: uuidv4(),
  name: 'Sprint 1 - 基础功能开发',
  startDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
  endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  totalStoryPoints: 40,
};

const users: Map<string, User> = new Map();
let logs: LogEntry[] = [];

function addLog(userId: string, userName: string, action: string, taskId?: string, taskTitle?: string) {
  const log: LogEntry = {
    id: uuidv4(),
    userId,
    userName,
    action,
    taskId,
    taskTitle,
    timestamp: new Date(),
  };
  logs.unshift(log);
  if (logs.length > 50) {
    logs = logs.slice(0, 50);
  }
  io.emit('log:new', log);
}

app.get('/api/tasks', (_req, res) => {
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority, assignee, storyPoints, status } = req.body;
  const statusTasks = tasks.filter((t) => t.status === (status || 'todo'));
  const newTask: Task = {
    id: uuidv4(),
    title: title || '新任务',
    description: description || '',
    priority: priority || 'medium',
    assignee: assignee || '未分配',
    status: status || 'todo',
    storyPoints: storyPoints || 1,
    order: statusTasks.length,
    createdAt: new Date(),
  };
  tasks.push(newTask);
  io.emit('task:created', newTask);
  
  const user = [...users.values()][0];
  if (user) {
    addLog(user.id, user.name, '创建了任务', newTask.id, newTask.title);
  }
  
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  
  const oldTask = tasks[taskIndex];
  const updatedTask = { ...oldTask, ...req.body, id: oldTask.id };
  
  if (updatedTask.status === 'done' && oldTask.status !== 'done') {
    updatedTask.completedAt = new Date();
  } else if (updatedTask.status !== 'done') {
    updatedTask.completedAt = undefined;
  }
  
  tasks[taskIndex] = updatedTask;
  io.emit('task:updated', updatedTask);
  
  const user = [...users.values()][0];
  if (user) {
    addLog(user.id, user.name, '更新了任务', updatedTask.id, updatedTask.title);
  }
  
  res.json(updatedTask);
});

app.post('/api/tasks/:id/update-status', (req, res) => {
  const { status, order } = req.body;
  const taskIndex = tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  
  const oldTask = tasks[taskIndex];
  const updatedTask = { ...oldTask, status, order };
  
  if (status === 'done' && oldTask.status !== 'done') {
    updatedTask.completedAt = new Date();
  } else if (status !== 'done') {
    updatedTask.completedAt = undefined;
  }
  
  const sameStatusTasks = tasks.filter((t) => t.status === status && t.id !== oldTask.id);
  sameStatusTasks.sort((a, b) => a.order - b.order);
  
  const newOrder = Math.min(Math.max(0, order), sameStatusTasks.length);
  sameStatusTasks.splice(newOrder, 0, updatedTask);
  sameStatusTasks.forEach((t, i) => {
    t.order = i;
  });
  
  const otherStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
  otherStatuses.forEach((s) => {
    if (s !== status) {
      const sTasks = tasks.filter((t) => t.status === s);
      sTasks.sort((a, b) => a.order - b.order);
      sTasks.forEach((t, i) => {
        t.order = i;
      });
    }
  });
  
  const taskIdx = tasks.findIndex((t) => t.id === updatedTask.id);
  tasks[taskIdx] = updatedTask;
  
  io.emit('task:moved', { task: updatedTask, allTasks: tasks });
  
  const user = [...users.values()][0];
  if (user) {
    const statusNames: Record<TaskStatus, string> = {
      'todo': '待办',
      'in-progress': '进行中',
      'done': '已完成',
    };
    addLog(user.id, user.name, `将任务移动到「${statusNames[status]}」`, updatedTask.id, updatedTask.title);
  }
  
  res.json(updatedTask);
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  
  const deletedTask = tasks[taskIndex];
  tasks.splice(taskIndex, 1);
  io.emit('task:deleted', deletedTask.id);
  
  const user = [...users.values()][0];
  if (user) {
    addLog(user.id, user.name, '删除了任务', deletedTask.id, deletedTask.title);
  }
  
  res.json({ success: true });
});

app.get('/api/sprint', (_req, res) => {
  res.json(sprint);
});

app.post('/api/sprint', (req, res) => {
  const { name, startDate, endDate, totalStoryPoints } = req.body;
  sprint = {
    ...sprint,
    id: uuidv4(),
    name: name || sprint.name,
    startDate: startDate || sprint.startDate,
    endDate: endDate || sprint.endDate,
    totalStoryPoints: totalStoryPoints || sprint.totalStoryPoints,
  };
  io.emit('sprint:updated', sprint);
  res.status(201).json(sprint);
});

app.get('/api/burndown', (_req, res) => {
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const burndownData = [];
  const pointsPerDay = sprint.totalStoryPoints / totalDays;
  
  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const idealRemaining = Math.max(0, sprint.totalStoryPoints - pointsPerDay * i);
    
    const completedByDay = tasks.filter((t) => {
      if (t.status !== 'done' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
      return completedDate <= dateStr && dateStr <= new Date().toISOString().split('T')[0];
    });
    
    const completedPoints = completedByDay.reduce((sum, t) => sum + t.storyPoints, 0);
    const actualRemaining = sprint.totalStoryPoints - completedPoints;
    
    const todayStr = new Date().toISOString().split('T')[0];
    burndownData.push({
      date: dateStr,
      ideal: Math.round(idealRemaining * 10) / 10,
      actual: dateStr <= todayStr ? Math.round(actualRemaining * 10) / 10 : null,
    });
  }
  
  res.json(burndownData);
});

app.get('/api/users', (_req, res) => {
  res.json(Array.from(users.values()));
});

app.get('/api/logs', (_req, res) => {
  res.json(logs);
});

io.on('connection', (socket) => {
  const userId = socket.id;
  const userName = `用户${Math.floor(Math.random() * 1000)}`;
  const avatars = ['👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '🧑‍🎨', '👨‍🔧', '👩‍🔧'];
  const avatar = avatars[Math.floor(Math.random() * avatars.length)];
  
  const newUser: User = {
    id: userId,
    name: userName,
    avatar,
    connectedAt: new Date(),
  };
  users.set(userId, newUser);
  
  io.emit('users:updated', Array.from(users.values()));
  socket.emit('user:self', newUser);
  
  addLog(userId, userName, '加入了看板');
  
  socket.on('task:move', (data) => {
    const { taskId, status, order } = data;
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;
    
    const oldTask = tasks[taskIndex];
    const updatedTask = { ...oldTask, status, order };
    
    if (status === 'done' && oldTask.status !== 'done') {
      updatedTask.completedAt = new Date();
    } else if (status !== 'done') {
      updatedTask.completedAt = undefined;
    }
    
    const sameStatusTasks = tasks.filter((t) => t.status === status && t.id !== oldTask.id);
    sameStatusTasks.sort((a, b) => a.order - b.order);
    
    const newOrder = Math.min(Math.max(0, order), sameStatusTasks.length);
    sameStatusTasks.splice(newOrder, 0, updatedTask);
    sameStatusTasks.forEach((t, i) => {
      t.order = i;
    });
    
    const taskIdx = tasks.findIndex((t) => t.id === updatedTask.id);
    tasks[taskIdx] = updatedTask;
    
    io.emit('task:moved', { task: updatedTask, allTasks: tasks });
    
    const statusNames: Record<TaskStatus, string> = {
      'todo': '待办',
      'in-progress': '进行中',
      'done': '已完成',
    };
    addLog(userId, userName, `将任务移动到「${statusNames[status]}」`, updatedTask.id, updatedTask.title);
  });
  
  socket.on('task:create', (data) => {
    const { title, description, priority, assignee, storyPoints, status } = data;
    const statusTasks = tasks.filter((t) => t.status === (status || 'todo'));
    const newTask: Task = {
      id: uuidv4(),
      title: title || '新任务',
      description: description || '',
      priority: priority || 'medium',
      assignee: assignee || '未分配',
      status: status || 'todo',
      storyPoints: storyPoints || 1,
      order: statusTasks.length,
      createdAt: new Date(),
    };
    tasks.push(newTask);
    io.emit('task:created', newTask);
    addLog(userId, userName, '创建了任务', newTask.id, newTask.title);
  });
  
  socket.on('task:update', (data) => {
    const taskIndex = tasks.findIndex((t) => t.id === data.id);
    if (taskIndex === -1) return;
    
    const oldTask = tasks[taskIndex];
    const updatedTask = { ...oldTask, ...data, id: oldTask.id };
    
    if (updatedTask.status === 'done' && oldTask.status !== 'done') {
      updatedTask.completedAt = new Date();
    } else if (updatedTask.status !== 'done') {
      updatedTask.completedAt = undefined;
    }
    
    tasks[taskIndex] = updatedTask;
    io.emit('task:updated', updatedTask);
    addLog(userId, userName, '更新了任务', updatedTask.id, updatedTask.title);
  });
  
  socket.on('task:delete', (taskId: string) => {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;
    
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    io.emit('task:deleted', taskId);
    addLog(userId, userName, '删除了任务', deletedTask.id, deletedTask.title);
  });
  
  socket.on('disconnect', () => {
    users.delete(userId);
    io.emit('users:updated', Array.from(users.values()));
    addLog(userId, userName, '离开了看板');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
