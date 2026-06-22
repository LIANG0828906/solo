import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Task, FocusRecord, TaskStatus, Priority, Statistics } from '../src/types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const tasks = new Map<string, Task>();
const focusRecords = new Map<string, FocusRecord>();

const seedTasks: Task[] = [
  {
    id: uuidv4(),
    title: '完成项目需求文档',
    status: 'todo',
    priority: 'high',
    estimatedHours: 2,
    focusCount: 0,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '设计数据库架构',
    status: 'todo',
    priority: 'medium',
    estimatedHours: 1.5,
    focusCount: 0,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '编写单元测试',
    status: 'in-progress',
    priority: 'low',
    estimatedHours: 3,
    focusCount: 2,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '代码审查',
    status: 'done',
    priority: 'medium',
    estimatedHours: 1,
    focusCount: 3,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

seedTasks.forEach(task => tasks.set(task.id, task));

function validateTask(data: any): { valid: boolean; error?: string } {
  if (!data.title || typeof data.title !== 'string') {
    return { valid: false, error: '标题不能为空' };
  }
  if (data.title.length > 200) {
    return { valid: false, error: '标题不能超过200字符' };
  }
  if (!['todo', 'in-progress', 'done'].includes(data.status)) {
    return { valid: false, error: '无效的任务状态' };
  }
  if (!['high', 'medium', 'low'].includes(data.priority)) {
    return { valid: false, error: '无效的优先级' };
  }
  if (typeof data.estimatedHours !== 'number' || data.estimatedHours < 0.25 || data.estimatedHours > 8) {
    return { valid: false, error: '预计工时必须在15分钟到8小时之间' };
  }
  return { valid: true };
}

app.get('/tasks', (req, res) => {
  const taskList = Array.from(tasks.values());
  taskList.sort((a, b) => {
    if (a.status !== b.status) {
      const statusOrder = { 'todo': 0, 'in-progress': 1, 'done': 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.order - b.order;
  });
  res.json(taskList);
});

app.post('/tasks', (req, res) => {
  const validation = validateTask(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const status = req.body.status as TaskStatus;
  const sameStatusTasks = Array.from(tasks.values()).filter(t => t.status === status);
  const maxOrder = sameStatusTasks.length > 0 
    ? Math.max(...sameStatusTasks.map(t => t.order)) 
    : -1;

  const newTask: Task = {
    id: uuidv4(),
    title: req.body.title,
    status,
    priority: req.body.priority as Priority,
    estimatedHours: req.body.estimatedHours,
    focusCount: 0,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.set(newTask.id, newTask);
  res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const validation = validateTask({ ...task, ...req.body });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const updatedTask: Task = {
    ...task,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  tasks.set(task.id, updatedTask);
  res.json(updatedTask);
});

app.patch('/tasks/:id/status', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const { status, order } = req.body;
  if (!['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({ error: '无效的任务状态' });
  }

  if (status !== task.status) {
    const targetStatusTasks = Array.from(tasks.values())
      .filter(t => t.status === status && t.id !== task.id);
    const maxOrder = targetStatusTasks.length > 0
      ? Math.max(...targetStatusTasks.map(t => t.order))
      : -1;
    
    task.order = order !== undefined ? order : maxOrder + 1;
  }

  task.status = status as TaskStatus;
  task.updatedAt = new Date().toISOString();

  res.json(task);
});

app.patch('/tasks/:id/focus', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  task.focusCount += 1;
  if (task.status === 'todo') {
    task.status = 'in-progress';
  }
  task.updatedAt = new Date().toISOString();

  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const deleted = tasks.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.status(204).send();
});

app.post('/timer/record', (req, res) => {
  const { taskId, duration, startTime, endTime, status } = req.body;

  if (typeof duration !== 'number' || duration <= 0) {
    return res.status(400).json({ error: '无效的专注时长' });
  }

  const task = taskId ? tasks.get(taskId) : null;
  const taskTitle = task?.title || '未关联任务';

  const record: FocusRecord = {
    id: uuidv4(),
    taskId: taskId || null,
    taskTitle,
    duration,
    startTime: startTime || new Date(Date.now() - duration * 1000).toISOString(),
    endTime: endTime || new Date().toISOString(),
    status: status || 'completed',
  };

  focusRecords.set(record.id, record);

  if (task && record.status === 'completed') {
    task.focusCount += 1;
    if (task.status === 'todo') {
      task.status = 'in-progress';
    }
    task.updatedAt = new Date().toISOString();
  }

  res.status(201).json(record);
});

app.get('/timer/records', (req, res) => {
  const records = Array.from(focusRecords.values())
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
  res.json(records);
});

app.get('/statistics', (req, res) => {
  const { period = 'week', date } = req.query as { period: string; date?: string };
  
  const allRecords = Array.from(focusRecords.values());
  const now = date ? new Date(date) : new Date();
  
  let filteredRecords = allRecords;
  
  if (period === 'day') {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);
    filteredRecords = allRecords.filter(r => {
      const recordDate = new Date(r.endTime);
      return recordDate >= dayStart && recordDate <= dayEnd;
    });
  } else if (period === 'week') {
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    filteredRecords = allRecords.filter(r => {
      const recordDate = new Date(r.endTime);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });
  } else if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    filteredRecords = allRecords.filter(r => {
      const recordDate = new Date(r.endTime);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });
  }

  const completedRecords = filteredRecords.filter(r => r.status === 'completed');
  const totalFocusTime = completedRecords.reduce((sum, r) => sum + r.duration, 0);
  const avgFocusDuration = completedRecords.length > 0 ? totalFocusTime / completedRecords.length : 0;

  const completedTaskIds = new Set(
    completedRecords
      .filter(r => r.taskId)
      .map(r => r.taskId)
  );
  const completedTasksCount = completedTaskIds.size;

  const recentRecords = Array.from(focusRecords.values())
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, 10);

  const stats: Statistics = {
    totalFocusTime,
    completedTasks: completedTasksCount,
    avgFocusDuration,
    records: recentRecords,
  };

  res.json(stats);
});

app.get('/statistics/daily', (req, res) => {
  const { period = 'week', date } = req.query as { period: string; date?: string };
  
  const now = date ? new Date(date) : new Date();
  const allRecords = Array.from(focusRecords.values());
  const dailyMap = new Map<string, { totalFocusTime: number; completedTasks: number }>();

  let days: Date[] = [];

  if (period === 'week') {
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
  } else if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
  } else {
    days = [new Date(now)];
  }

  days.forEach(day => {
    const dateStr = day.toISOString().split('T')[0];
    dailyMap.set(dateStr, { totalFocusTime: 0, completedTasks: 0 });
  });

  const dayStart = new Date(days[0]);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(days[days.length - 1]);
  dayEnd.setHours(23, 59, 59, 999);

  const periodRecords = allRecords.filter(r => {
    const recordDate = new Date(r.endTime);
    return recordDate >= dayStart && recordDate <= dayEnd;
  });

  periodRecords.forEach(record => {
    const dateStr = new Date(record.endTime).toISOString().split('T')[0];
    const existing = dailyMap.get(dateStr);
    if (existing && record.status === 'completed') {
      existing.totalFocusTime += record.duration;
      if (record.taskId) {
        existing.completedTasks += 1;
      }
    }
  });

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalFocusTime: data.totalFocusTime,
      completedTasks: data.completedTasks,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(dailyStats);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
