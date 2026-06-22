import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  storyPoints: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface DailyBurndown {
  day: number;
  date: string;
  ideal: number;
  actual: number;
}

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dailyBurndown: DailyBurndown[];
}

interface User {
  id: string;
  name: string;
  online: boolean;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(express.json());

let tasks: Task[] = [];
let sprint: Sprint | null = null;
let users: User[] = [];
let activityLogs: ActivityLog[] = [];

const generateBurndownData = (totalPoints: number, startDate: Date, endDate: Date): DailyBurndown[] => {
  const days: DailyBurndown[] = [];
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const pointsPerDay = totalPoints / (totalDays - 1);

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push({
      day: i + 1,
      date: dateStr,
      ideal: Math.max(0, totalPoints - pointsPerDay * i),
      actual: i === 0 ? totalPoints : 0,
    });
  }
  return days;
};

const recalculateBurndown = () => {
  if (!sprint) return;

  const donePoints = tasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.storyPoints, 0);

  const remainingPoints = sprint.totalStoryPoints - donePoints;

  const startDateParts = sprint.startDate.split('-').map(Number);
  const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const daysPassed = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  sprint.dailyBurndown = sprint.dailyBurndown.map((day, index) => {
    if (index === 0) {
      return { ...day, actual: sprint!.totalStoryPoints };
    }
    if (index <= daysPassed) {
      return { ...day, actual: remainingPoints };
    }
    return day;
  });
};

const initData = () => {
  const now = new Date().toISOString();

  tasks = [
    {
      id: uuidv4(),
      title: '用户登录功能开发',
      description: '实现用户登录、注册和密码找回功能',
      status: 'todo',
      priority: 'high',
      assignee: '张三',
      storyPoints: 5,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '任务看板界面设计',
      description: '设计敏捷看板的UI界面和交互原型',
      status: 'todo',
      priority: 'medium',
      assignee: '李四',
      storyPoints: 3,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '后端API接口开发',
      description: '开发任务管理的RESTful API接口',
      status: 'in-progress',
      priority: 'high',
      assignee: '王五',
      storyPoints: 8,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '数据库设计',
      description: '设计任务、用户、Sprint等核心数据模型',
      status: 'in-progress',
      priority: 'medium',
      assignee: '赵六',
      storyPoints: 5,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '项目环境搭建',
      description: '搭建前端和后端开发环境，配置CI/CD',
      status: 'done',
      priority: 'high',
      assignee: '张三',
      storyPoints: 3,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '需求分析文档',
      description: '完成产品需求分析和技术方案设计文档',
      status: 'done',
      priority: 'low',
      assignee: '李四',
      storyPoints: 2,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  sprint = {
    id: uuidv4(),
    name: 'Sprint 1 - 核心功能开发',
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    totalStoryPoints: 28,
    dailyBurndown: generateBurndownData(28, startDate, endDate),
  };

  recalculateBurndown();

  activityLogs = [
    {
      id: uuidv4(),
      userId: 'system',
      userName: '系统',
      action: '创建了 Sprint',
      timestamp: now,
    },
  ];
};

initData();

const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const newLog: ActivityLog = {
    ...log,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  activityLogs.unshift(newLog);
  io.emit('activity:new', newLog);
};

app.get('/api/tasks', (_req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, status = 'todo', priority = 'medium', assignee = '', storyPoints = 1 } = req.body;

  const maxOrder = tasks.filter((t) => t.status === status).length;

  const newTask: Task = {
    id: uuidv4(),
    title,
    description: description || '',
    status,
    priority,
    assignee,
    storyPoints: Number(storyPoints),
    order: maxOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.push(newTask);

  addActivityLog({
    userId: 'system',
    userName: '系统',
    action: '创建了任务',
    taskId: newTask.id,
    taskTitle: newTask.title,
  });

  io.emit('task:created', newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const oldTask = tasks[taskIndex];
  const updatedTask: Task = {
    ...oldTask,
    ...req.body,
    id: oldTask.id,
    createdAt: oldTask.createdAt,
    updatedAt: new Date().toISOString(),
  };

  tasks[taskIndex] = updatedTask;

  if (oldTask.status !== updatedTask.status) {
    recalculateBurndown();
    io.emit('sprint:updated', sprint);
  }

  addActivityLog({
    userId: 'system',
    userName: '系统',
    action: '更新了任务',
    taskId: updatedTask.id,
    taskTitle: updatedTask.title,
  });

  io.emit('task:updated', updatedTask);
  res.json(updatedTask);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const deletedTask = tasks[taskIndex];
  tasks.splice(taskIndex, 1);

  tasks = tasks.map((t) => {
    if (t.status === deletedTask.status && t.order > deletedTask.order) {
      return { ...t, order: t.order - 1 };
    }
    return t;
  });

  if (deletedTask.status === 'done') {
    recalculateBurndown();
    io.emit('sprint:updated', sprint);
  }

  addActivityLog({
    userId: 'system',
    userName: '系统',
    action: '删除了任务',
    taskId: deletedTask.id,
    taskTitle: deletedTask.title,
  });

  io.emit('task:deleted', id);
  res.json({ message: 'Task deleted' });
});

app.post('/api/tasks/:id/update', (req, res) => {
  const { id } = req.params;
  const { status, order } = req.body;
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const oldTask = tasks[taskIndex];
  const oldStatus = oldTask.status;
  const oldOrder = oldTask.order;

  if (oldStatus !== status) {
    tasks = tasks.map((t) => {
      if (t.status === oldStatus && t.order > oldOrder) {
        return { ...t, order: t.order - 1 };
      }
      return t;
    });

    tasks = tasks.map((t) => {
      if (t.status === status && t.order >= order) {
        return { ...t, order: t.order + 1 };
      }
      return t;
    });
  } else if (oldOrder !== order) {
    if (order > oldOrder) {
      tasks = tasks.map((t) => {
        if (t.status === status && t.order > oldOrder && t.order <= order) {
          return { ...t, order: t.order - 1 };
        }
        return t;
      });
    } else {
      tasks = tasks.map((t) => {
        if (t.status === status && t.order >= order && t.order < oldOrder) {
          return { ...t, order: t.order + 1 };
        }
        return t;
      });
    }
  }

  const updatedTask: Task = {
    ...oldTask,
    status,
    order,
    updatedAt: new Date().toISOString(),
  };

  const currentIndex = tasks.findIndex((t) => t.id === id);
  tasks[currentIndex] = updatedTask;

  if (oldStatus !== status) {
    recalculateBurndown();
    io.emit('sprint:updated', sprint);
  }

  addActivityLog({
    userId: 'system',
    userName: '系统',
    action: `移动任务到 ${status === 'todo' ? '待办' : status === 'in-progress' ? '进行中' : '已完成'}`,
    taskId: updatedTask.id,
    taskTitle: updatedTask.title,
  });

  io.emit('task:moved', updatedTask);
  res.json(updatedTask);
});

app.get('/api/sprint', (_req, res) => {
  res.json(sprint);
});

app.post('/api/sprint', (req, res) => {
  const { name, startDate, endDate, totalStoryPoints } = req.body;

  const startParts = startDate.split('-').map(Number);
  const endParts = endDate.split('-').map(Number);
  const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  sprint = {
    id: uuidv4(),
    name,
    startDate,
    endDate,
    totalStoryPoints: Number(totalStoryPoints),
    dailyBurndown: generateBurndownData(Number(totalStoryPoints), start, end),
  };

  recalculateBurndown();

  addActivityLog({
    userId: 'system',
    userName: '系统',
    action: '创建了新 Sprint',
  });

  io.emit('sprint:updated', sprint);
  res.status(201).json(sprint);
});

app.get('/api/users', (_req, res) => {
  res.json(users.filter((u) => u.online));
});

app.get('/api/activity', (_req, res) => {
  res.json(activityLogs);
});

const generateUserName = () => {
  const adjectives = ['快乐的', '勇敢的', '聪明的', '可爱的', '神秘的', '帅气的'];
  const nouns = ['小猫', '小狗', '熊猫', '兔子', '狐狸', '企鹅'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
};

io.on('connection', (socket) => {
  const userId = uuidv4();
  const userName = generateUserName();

  const newUser: User = {
    id: userId,
    name: userName,
    online: true,
  };

  users.push(newUser);

  socket.emit('user:self', newUser);
  io.emit('user:joined', newUser);

  addActivityLog({
    userId,
    userName,
    action: '加入了团队',
  });

  socket.on('disconnect', () => {
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].online = false;
      io.emit('user:left', users[userIndex]);

      addActivityLog({
        userId,
        userName,
        action: '离开了团队',
      });
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is ready`);
});
