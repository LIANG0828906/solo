import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

// ==================== 类型定义 ====================

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  avatarColor: string;
  role: 'admin' | 'member';
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  remainingHours: number;
  createdAt: string;
  dueDate: string;
}

interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  note: string;
  createdAt: string;
}

interface BurndownPoint {
  date: string;
  remainingHours: number;
}

interface AuthRequest extends Request {
  user?: User;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== 辅助函数 ====================

const generateId = (): string => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const getWeekDates = (): Date[] => {
  const dates: Date[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const getPastNDates = (n: number): Date[] => {
  const dates: Date[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d);
  }
  return dates;
};

const sendResponse = <T>(res: Response, data: T, message = 'Success'): void => {
  const response: ApiResponse<T> = { success: true, data, message };
  res.json(response);
};

const sendError = (res: Response, error: string, statusCode = 400): void => {
  const response: ApiResponse<null> = { success: false, error, message: error };
  res.status(statusCode).json(response);
};

// ==================== 内存数据库 ====================

const JWT_SECRET = 'secret-key';
const PORT = 3001;

const avatarColors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2', '#DB2777'];

const users: User[] = [
  { id: '1', username: 'admin', password: '123456', name: '管理员', avatarColor: '#7C3AED', role: 'admin' },
  { id: '2', username: 'zhangsan', password: '123456', name: '张三', avatarColor: '#2563EB', role: 'member' },
  { id: '3', username: 'lisi', password: '123456', name: '李四', avatarColor: '#059669', role: 'member' },
  { id: '4', username: 'wangwu', password: '123456', name: '王五', avatarColor: '#D97706', role: 'member' },
  { id: '5', username: 'zhaoliu', password: '123456', name: '赵六', avatarColor: '#DC2626', role: 'member' },
  { id: '6', username: 'sunqi', password: '123456', name: '孙七', avatarColor: '#0891B2', role: 'member' },
];

const tasks: Task[] = [
  { id: 't1', title: '需求分析文档', description: '完成项目需求分析文档编写', status: 'done', assigneeId: '2', priority: 'high', estimatedHours: 16, remainingHours: 0, createdAt: formatDate(new Date(Date.now() - 7 * 86400000)), dueDate: formatDate(new Date(Date.now() - 2 * 86400000)) },
  { id: 't2', title: '数据库设计', description: '设计系统数据库表结构', status: 'done', assigneeId: '3', priority: 'high', estimatedHours: 24, remainingHours: 0, createdAt: formatDate(new Date(Date.now() - 7 * 86400000)), dueDate: formatDate(new Date(Date.now() - 1 * 86400000)) },
  { id: 't3', title: 'UI原型设计', description: '使用Figma完成UI原型设计', status: 'done', assigneeId: '1', priority: 'medium', estimatedHours: 20, remainingHours: 0, createdAt: formatDate(new Date(Date.now() - 6 * 86400000)), dueDate: formatDate(new Date(Date.now() + 0 * 86400000)) },
  { id: 't4', title: '用户模块开发', description: '实现用户注册、登录、权限管理', status: 'in-progress', assigneeId: '2', priority: 'high', estimatedHours: 32, remainingHours: 12, createdAt: formatDate(new Date(Date.now() - 5 * 86400000)), dueDate: formatDate(new Date(Date.now() + 3 * 86400000)) },
  { id: 't5', title: '任务管理模块', description: '实现任务CRUD及状态流转', status: 'in-progress', assigneeId: '4', priority: 'high', estimatedHours: 28, remainingHours: 8, createdAt: formatDate(new Date(Date.now() - 4 * 86400000)), dueDate: formatDate(new Date(Date.now() + 2 * 86400000)) },
  { id: 't6', title: '工时记录模块', description: '实现工时填报与统计', status: 'in-progress', assigneeId: '3', priority: 'medium', estimatedHours: 20, remainingHours: 6, createdAt: formatDate(new Date(Date.now() - 3 * 86400000)), dueDate: formatDate(new Date(Date.now() + 4 * 86400000)) },
  { id: 't7', title: '燃尽图展示', description: '实现项目燃尽图数据可视化', status: 'todo', assigneeId: '5', priority: 'medium', estimatedHours: 16, remainingHours: 16, createdAt: formatDate(new Date(Date.now() - 2 * 86400000)), dueDate: formatDate(new Date(Date.now() + 5 * 86400000)) },
  { id: 't8', title: '成员管理模块', description: '实现成员添加、编辑、删除', status: 'todo', assigneeId: '6', priority: 'high', estimatedHours: 18, remainingHours: 18, createdAt: formatDate(new Date(Date.now() - 2 * 86400000)), dueDate: formatDate(new Date(Date.now() + 4 * 86400000)) },
  { id: 't9', title: '项目设置页面', description: '实现项目基本信息配置', status: 'todo', assigneeId: '2', priority: 'low', estimatedHours: 8, remainingHours: 8, createdAt: formatDate(new Date(Date.now() - 1 * 86400000)), dueDate: formatDate(new Date(Date.now() + 6 * 86400000)) },
  { id: 't10', title: '通知提醒功能', description: '实现站内消息与邮件通知', status: 'todo', assigneeId: '4', priority: 'medium', estimatedHours: 24, remainingHours: 24, createdAt: formatDate(new Date(Date.now() - 1 * 86400000)), dueDate: formatDate(new Date(Date.now() + 7 * 86400000)) },
  { id: 't11', title: '数据导出功能', description: '支持任务与工时数据Excel导出', status: 'todo', assigneeId: '5', priority: 'low', estimatedHours: 12, remainingHours: 12, createdAt: formatDate(new Date()), dueDate: formatDate(new Date(Date.now() + 8 * 86400000)) },
  { id: 't12', title: '系统性能优化', description: '对关键接口进行性能调优', status: 'in-progress', assigneeId: '6', priority: 'high', estimatedHours: 20, remainingHours: 14, createdAt: formatDate(new Date(Date.now() - 3 * 86400000)), dueDate: formatDate(new Date(Date.now() + 3 * 86400000)) },
];

const timeLogs: TimeLog[] = [];

const taskLogMap: Record<string, { daysAgo: number; hours: number; note: string }[]> = {
  t1: [
    { daysAgo: 7, hours: 4, note: '调研用户需求' },
    { daysAgo: 6, hours: 6, note: '整理功能列表' },
    { daysAgo: 5, hours: 3, note: '编写需求初稿' },
    { daysAgo: 4, hours: 3, note: '评审修改' },
  ],
  t2: [
    { daysAgo: 7, hours: 5, note: 'ER图设计' },
    { daysAgo: 6, hours: 6, note: '表结构定义' },
    { daysAgo: 5, hours: 5, note: '索引与约束设计' },
    { daysAgo: 4, hours: 4, note: 'SQL脚本编写' },
    { daysAgo: 3, hours: 4, note: '优化调整' },
  ],
  t3: [
    { daysAgo: 6, hours: 5, note: '低保真原型' },
    { daysAgo: 5, hours: 5, note: '高保真设计' },
    { daysAgo: 4, hours: 4, note: '交互设计' },
    { daysAgo: 3, hours: 3, note: '设计评审' },
    { daysAgo: 2, hours: 3, note: '修改完善' },
  ],
  t4: [
    { daysAgo: 5, hours: 4, note: '登录接口开发' },
    { daysAgo: 4, hours: 5, note: 'JWT权限实现' },
    { daysAgo: 3, hours: 5, note: '用户CRUD接口' },
    { daysAgo: 2, hours: 3, note: '前端页面对接' },
    { daysAgo: 1, hours: 3, note: '联调测试' },
  ],
  t5: [
    { daysAgo: 4, hours: 4, note: '任务列表接口' },
    { daysAgo: 3, hours: 5, note: '状态流转逻辑' },
    { daysAgo: 2, hours: 5, note: '拖拽交互开发' },
    { daysAgo: 1, hours: 6, note: '过滤与搜索' },
  ],
  t6: [
    { daysAgo: 3, hours: 4, note: '工时填报页面' },
    { daysAgo: 2, hours: 5, note: '数据校验' },
    { daysAgo: 1, hours: 5, note: '统计图表开发' },
  ],
  t12: [
    { daysAgo: 3, hours: 3, note: '慢查询分析' },
    { daysAgo: 2, hours: 3, note: '索引优化' },
    { daysAgo: 1, hours: 0, note: '缓存方案设计' },
  ],
};

Object.entries(taskLogMap).forEach(([taskId, logs]) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  logs.forEach(log => {
    const date = new Date();
    date.setDate(date.getDate() - log.daysAgo);
    timeLogs.push({
      id: generateId(),
      taskId,
      userId: task.assigneeId,
      date: formatDate(date),
      hours: log.hours,
      note: log.note,
      createdAt: date.toISOString(),
    });
  });
});

const burndownHistory: BurndownPoint[] = [];
const past7Days = getPastNDates(7);
const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
let currentRemaining = totalEstimatedHours;

past7Days.forEach((date, index) => {
  const dayLogs = timeLogs.filter(tl => tl.date === formatDate(date));
  const loggedHours = dayLogs.reduce((sum, tl) => sum + tl.hours, 0);
  currentRemaining = Math.max(0, currentRemaining - loggedHours);
  burndownHistory.push({
    date: formatDate(date),
    remainingHours: Number(currentRemaining.toFixed(1)),
  });
});

// ==================== JWT 中间件 ====================

const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, '未提供认证令牌', 401);
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      sendError(res, '用户不存在', 401);
      return;
    }
    req.user = user;
    next();
  } catch {
    sendError(res, '认证令牌无效或已过期', 401);
  }
};

// ==================== Express 应用 ====================

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==================== 认证接口 ====================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    sendError(res, '用户名和密码不能为空');
    return;
  }
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    sendError(res, '用户名或密码错误', 401);
    return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _pwd, ...userWithoutPassword } = user;
  sendResponse(res, { token, user: userWithoutPassword }, '登录成功');
});

app.get('/api/auth/me', authenticateJWT, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendError(res, '用户未认证', 401);
    return;
  }
  const { password: _pwd, ...userWithoutPassword } = req.user;
  sendResponse(res, userWithoutPassword);
});

// ==================== 任务接口 ====================

app.get('/api/tasks', authenticateJWT, (_req: AuthRequest, res: Response) => {
  sendResponse(res, tasks);
});

app.post('/api/tasks', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { title, description, status = 'todo', assigneeId, priority = 'medium', estimatedHours, dueDate } = req.body;
  if (!title || !assigneeId || estimatedHours === undefined) {
    sendError(res, '缺少必填字段: title, assigneeId, estimatedHours');
    return;
  }
  const validStatuses: Task['status'][] = ['todo', 'in-progress', 'done'];
  if (!validStatuses.includes(status)) {
    sendError(res, '任务状态无效');
    return;
  }
  const assignee = users.find(u => u.id === assigneeId);
  if (!assignee) {
    sendError(res, '指定的负责人不存在');
    return;
  }
  const newTask: Task = {
    id: generateId(),
    title,
    description: description || '',
    status,
    assigneeId,
    priority,
    estimatedHours: Number(estimatedHours),
    remainingHours: status === 'done' ? 0 : Number(estimatedHours),
    createdAt: formatDate(new Date()),
    dueDate: dueDate || formatDate(new Date(Date.now() + 7 * 86400000)),
  };
  tasks.push(newTask);
  sendResponse(res, newTask, '任务创建成功');
});

app.put('/api/tasks/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    sendError(res, '任务不存在', 404);
    return;
  }
  const { title, description, status, assigneeId, priority, estimatedHours, remainingHours, dueDate } = req.body;
  const task = tasks[taskIndex];
  if (status !== undefined) {
    const validStatuses: Task['status'][] = ['todo', 'in-progress', 'done'];
    if (!validStatuses.includes(status)) {
      sendError(res, '任务状态无效');
      return;
    }
    task.status = status;
    if (status === 'done') task.remainingHours = 0;
  }
  if (assigneeId !== undefined) {
    const assignee = users.find(u => u.id === assigneeId);
    if (!assignee) {
      sendError(res, '指定的负责人不存在');
      return;
    }
    task.assigneeId = assigneeId;
  }
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (estimatedHours !== undefined) task.estimatedHours = Number(estimatedHours);
  if (remainingHours !== undefined) task.remainingHours = Number(remainingHours);
  if (dueDate !== undefined) task.dueDate = dueDate;
  sendResponse(res, task, '任务更新成功');
});

app.delete('/api/tasks/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    sendError(res, '任务不存在', 404);
    return;
  }
  tasks.splice(taskIndex, 1);
  const logIndexes: number[] = [];
  timeLogs.forEach((tl, idx) => {
    if (tl.taskId === id) logIndexes.push(idx);
  });
  logIndexes.reverse().forEach(idx => timeLogs.splice(idx, 1));
  sendResponse(res, { id }, '任务删除成功');
});

// ==================== 工时记录接口 ====================

app.get('/api/timelogs/task/:taskId', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { taskId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const taskLogs = timeLogs
    .filter(tl => tl.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = taskLogs.length;
  const startIndex = (page - 1) * limit;
  const paginatedData = taskLogs.slice(startIndex, startIndex + limit);
  sendResponse(res, {
    data: paginatedData,
    hasMore: startIndex + limit < total,
    total,
    page,
    limit,
  });
});

app.post('/api/timelogs', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { taskId, userId, date, hours, note } = req.body;
  if (!taskId || !userId || !date || hours === undefined) {
    sendError(res, '缺少必填字段: taskId, userId, date, hours');
    return;
  }
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    sendError(res, '任务不存在');
    return;
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    sendError(res, '用户不存在');
    return;
  }
  if (hours <= 0 || hours > 24) {
    sendError(res, '工时必须在0-24小时之间');
    return;
  }
  const newLog: TimeLog = {
    id: generateId(),
    taskId,
    userId,
    date,
    hours: Number(hours),
    note: note || '',
    createdAt: new Date().toISOString(),
  };
  timeLogs.push(newLog);
  task.remainingHours = Math.max(0, task.remainingHours - Number(hours));
  if (task.remainingHours === 0 && task.status !== 'done') {
    task.status = 'done';
  }
  sendResponse(res, newLog, '工时记录创建成功');
});

app.get('/api/timelogs/user/:userId/weekly', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const weekDates = getWeekDates();
  const dateStrs = weekDates.map(d => formatDate(d));
  const userLogs = timeLogs.filter(tl => tl.userId === userId && dateStrs.includes(tl.date));
  const taskIdsInWeek = Array.from(new Set(userLogs.map(tl => tl.taskId)));
  const tasksInWeek = tasks.filter(t => taskIdsInWeek.includes(t.id));
  const matrix: number[][] = dateStrs.map(() => tasksInWeek.map(() => 0));
  userLogs.forEach(log => {
    const dateIndex = dateStrs.indexOf(log.date);
    const taskIndex = tasksInWeek.findIndex(t => t.id === log.taskId);
    if (dateIndex !== -1 && taskIndex !== -1) {
      matrix[dateIndex][taskIndex] += log.hours;
    }
  });
  const taskTotals = tasksInWeek.map(task => {
    const taskLogs = userLogs.filter(tl => tl.taskId === task.id);
    const totalHours = taskLogs.reduce((sum, tl) => sum + tl.hours, 0);
    const segments = dateStrs.map(date => {
      const dayLogs = taskLogs.filter(tl => tl.date === date);
      return dayLogs.reduce((sum, tl) => sum + tl.hours, 0);
    });
    return {
      taskId: task.id,
      taskName: task.title,
      totalHours,
      segments,
    };
  });
  sendResponse(res, {
    dates: dateStrs,
    tasks: tasksInWeek,
    matrix,
    taskTotals,
  });
});

// ==================== 成员接口 ====================

app.get('/api/members', authenticateJWT, (_req: AuthRequest, res: Response) => {
  const weekDates = getWeekDates();
  const dateStrs = weekDates.map(d => formatDate(d));
  const members = users.map(user => {
    const { password: _pwd, ...userInfo } = user;
    const userLogs = timeLogs.filter(tl => tl.userId === user.id && dateStrs.includes(tl.date));
    const weeklyHours = userLogs.reduce((sum, tl) => sum + tl.hours, 0);
    const userTasks = tasks.filter(t => t.assigneeId === user.id);
    const totalTasks = userTasks.length;
    const doneTasks = userTasks.filter(t => t.status === 'done').length;
    return {
      ...userInfo,
      weeklyHours,
      totalTasks,
      doneTasks,
    };
  });
  sendResponse(res, members);
});

app.post('/api/members', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { username, password, name, role = 'member' } = req.body;
  if (!username || !password || !name) {
    sendError(res, '缺少必填字段: username, password, name');
    return;
  }
  if (users.find(u => u.username === username)) {
    sendError(res, '用户名已存在');
    return;
  }
  const validRoles: User['role'][] = ['admin', 'member'];
  if (!validRoles.includes(role)) {
    sendError(res, '角色无效');
    return;
  }
  const newUser: User = {
    id: generateId(),
    username,
    password,
    name,
    avatarColor: avatarColors[users.length % avatarColors.length],
    role,
  };
  users.push(newUser);
  const { password: _pwd, ...userWithoutPassword } = newUser;
  sendResponse(res, userWithoutPassword, '成员添加成功');
});

// ==================== 燃尽图接口 ====================

app.get('/api/burndown', authenticateJWT, (_req: AuthRequest, res: Response) => {
  const days = 7;
  const dates = getPastNDates(days);
  const dateStrs = dates.map(d => formatDate(d));
  let actualHours: number[] = [];
  if (burndownHistory.length >= days) {
    actualHours = dateStrs.map(date => {
      const point = burndownHistory.find(b => b.date === date);
      return point ? point.remainingHours : 0;
    });
  } else {
    let remaining = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    actualHours = dateStrs.map(date => {
      const dayLogs = timeLogs.filter(tl => tl.date === date);
      const loggedHours = dayLogs.reduce((sum, tl) => sum + tl.hours, 0);
      remaining = Math.max(0, remaining - loggedHours);
      return Number(remaining.toFixed(1));
    });
  }
  if (actualHours.every(v => v === 0)) {
    const total = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const currentRemaining = tasks.reduce((sum, t) => sum + t.remainingHours, 0);
    actualHours = dateStrs.map((_, index) => {
      const progress = index / (days - 1);
      return Number((total - (total - currentRemaining) * progress).toFixed(1));
    });
  }
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const idealHours = dateStrs.map((_, index) => {
    const progress = index / (days - 1);
    return Number((totalHours * (1 - progress)).toFixed(1));
  });
  sendResponse(res, {
    dates: dateStrs,
    idealHours,
    actualHours,
    totalHours,
  });
});

// ==================== 错误处理中间件 ====================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  sendError(res, '服务器内部错误', 500);
});

app.use((_req: Request, res: Response) => {
  sendError(res, '接口不存在', 404);
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`
========================================
  Server is running on http://localhost:${PORT}
  Environment: development
  JWT Secret: ${JWT_SECRET}
  Test Account: admin / 123456
========================================
  `);
});
