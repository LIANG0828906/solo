import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

let idCounter = 100;
const genId = () => String(++idCounter);

const teamMembers = [
  { id: 'm1', name: 'Alice', avatar: '👩‍💻', online: true, color: '#FFB5C2' },
  { id: 'm2', name: 'Bob', avatar: '👨‍💻', online: true, color: '#B5EAD7' },
  { id: 'm3', name: 'Charlie', avatar: '🧑‍🎨', online: false, color: '#C7CEEA' },
  { id: 'm4', name: 'Diana', avatar: '👩‍🔬', online: true, color: '#FFD1DC' },
  { id: 'm5', name: 'Eve', avatar: '🧑‍🚀', online: false, color: '#B5EAD7' },
  { id: 'm6', name: 'Frank', avatar: '👨‍🏫', online: true, color: '#FFB5C2' },
];

const tasks = [
  { id: 't1', title: '用户登录接口', description: '实现JWT认证的登录API', priority: 'high', assignee: 'm1', remainingHours: 4, lane: 'todo', order: 0, type: 'task', sprintId: 's1' },
  { id: 't2', title: '数据库Schema设计', description: '设计核心业务表结构', priority: 'urgent', assignee: 'm2', remainingHours: 2, lane: 'todo', order: 1, type: 'milestone', sprintId: 's1' },
  { id: 't3', title: '前端路由搭建', description: 'React Router页面路由配置', priority: 'medium', assignee: 'm3', remainingHours: 6, lane: 'todo', order: 2, type: 'task', sprintId: 's1' },
  { id: 't4', title: 'CI/CD流水线', description: 'GitHub Actions自动化部署', priority: 'low', assignee: 'm4', remainingHours: 3, lane: 'todo', order: 3, type: 'task', sprintId: 's1' },
  { id: 't5', title: '注册页面UI', description: '用户注册表单与验证', priority: 'high', assignee: 'm1', remainingHours: 5, lane: 'inProgress', order: 0, type: 'task', sprintId: 's1' },
  { id: 't6', title: 'API网关配置', description: 'Kong网关路由与限流', priority: 'medium', assignee: 'm2', remainingHours: 8, lane: 'inProgress', order: 1, type: 'task', sprintId: 's1' },
  { id: 't7', title: '单元测试框架', description: 'Jest测试环境搭建', priority: 'medium', assignee: 'm5', remainingHours: 3, lane: 'inProgress', order: 2, type: 'task', sprintId: 's1' },
  { id: 't8', title: '需求评审完成', description: 'Sprint 1需求评审会议', priority: 'urgent', assignee: 'm6', remainingHours: 0, lane: 'done', order: 0, type: 'milestone', sprintId: 's1' },
  { id: 't9', title: '项目初始化', description: '仓库创建与基础配置', priority: 'high', assignee: 'm2', remainingHours: 0, lane: 'done', order: 1, type: 'task', sprintId: 's1' },
  { id: 't10', title: '设计系统定义', description: '颜色/字体/组件规范', priority: 'medium', assignee: 'm3', remainingHours: 0, lane: 'done', order: 2, type: 'task', sprintId: 's1' },
  { id: 't11', title: '权限模型设计', description: 'RBAC权限体系设计', priority: 'high', assignee: 'm6', remainingHours: 0, lane: 'done', order: 3, type: 'task', sprintId: 's1' },
  { id: 't12', title: '用户资料编辑', description: '个人资料页面开发', priority: 'low', assignee: 'm4', remainingHours: 4, lane: 'todo', order: 4, type: 'task', sprintId: 's1' },
  { id: 't13', title: '消息推送服务', description: 'WebSocket实时通知', priority: 'high', assignee: 'm5', remainingHours: 6, lane: 'inProgress', order: 3, type: 'task', sprintId: 's1' },
  { id: 't14', title: '日志系统集成', description: 'ELK日志收集与分析', priority: 'low', assignee: 'm6', remainingHours: 2, lane: 'todo', order: 5, type: 'task', sprintId: 's1' },
  { id: 't15', title: '性能监控面板', description: 'Grafana监控大屏', priority: 'medium', assignee: 'm1', remainingHours: 5, lane: 'todo', order: 6, type: 'task', sprintId: 's1' },
];

const dependencies = [
  { id: 'd1', fromTaskId: 't2', toTaskId: 't1' },
  { id: 'd2', fromTaskId: 't2', toTaskId: 't5' },
  { id: 'd3', fromTaskId: 't1', toTaskId: 't13' },
  { id: 'd4', fromTaskId: 't3', toTaskId: 't5' },
  { id: 'd5', fromTaskId: 't7', toTaskId: 't15' },
  { id: 'd6', fromTaskId: 't6', toTaskId: 't14' },
  { id: 'd7', fromTaskId: 't9', toTaskId: 't3' },
  { id: 'd8', fromTaskId: 't10', toTaskId: 't5' },
  { id: 'd9', fromTaskId: 't4', toTaskId: 't15' },
  { id: 'd10', fromTaskId: 't11', toTaskId: 't1' },
];

const comments = [
  { id: 'c1', taskId: 't8', author: 'Alice', content: '需求评审非常顺利，团队对优先级达成共识', timestamp: Date.now() - 86400000 * 3 },
  { id: 'c2', taskId: 't8', author: 'Bob', content: 'API设计文档需要补充错误码定义', timestamp: Date.now() - 86400000 * 2 },
  { id: 'c3', taskId: 't9', author: 'Charlie', content: '基础配置完成，ESLint和Prettier已集成', timestamp: Date.now() - 86400000 * 2 },
  { id: 'c4', taskId: 't10', author: 'Diana', content: '设计系统已同步到Figma', timestamp: Date.now() - 86400000 },
  { id: 'c5', taskId: 't11', author: 'Frank', content: 'RBAC模型已通过安全评审', timestamp: Date.now() - 86400000 },
];

const votes = [
  { taskId: 't8', voter: 'Alice', emoji: 'happy' },
  { taskId: 't8', voter: 'Bob', emoji: 'neutral' },
  { taskId: 't8', voter: 'Charlie', emoji: 'happy' },
  { taskId: 't9', voter: 'Alice', emoji: 'happy' },
  { taskId: 't9', voter: 'Bob', emoji: 'happy' },
  { taskId: 't9', voter: 'Diana', emoji: 'happy' },
  { taskId: 't10', voter: 'Charlie', emoji: 'neutral' },
  { taskId: 't10', voter: 'Diana', emoji: 'happy' },
  { taskId: 't10', voter: 'Eve', emoji: 'sad' },
  { taskId: 't11', voter: 'Frank', emoji: 'happy' },
  { taskId: 't11', voter: 'Alice', emoji: 'neutral' },
];

const sprints = [
  { id: 's1', name: 'Sprint 1 - 基础架构', startDate: Date.now() - 86400000 * 7, endDate: Date.now() + 86400000 * 7 },
];

app.get('/api/tasks', (req, res) => {
  const sprintId = req.query.sprintId || 's1';
  res.json(tasks.filter(t => t.sprintId === sprintId));
});

app.post('/api/tasks', (req, res) => {
  const task = { id: genId(), order: tasks.filter(t => t.lane === req.body.lane).length, ...req.body, sprintId: req.body.sprintId || 's1' };
  tasks.push(task);
  io.emit('task:created', task);
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks[idx] = { ...tasks[idx], ...req.body };
  io.emit('task:updated', tasks[idx]);
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  const [removed] = tasks.splice(idx, 1);
  for (let i = dependencies.length - 1; i >= 0; i--) {
    if (dependencies[i].fromTaskId === removed.id || dependencies[i].toTaskId === removed.id) {
      dependencies.splice(i, 1);
    }
  }
  io.emit('task:deleted', { id: removed.id });
  res.json({ success: true });
});

app.get('/api/dependencies', (req, res) => {
  const sprintId = req.query.sprintId || 's1';
  const taskIds = new Set(tasks.filter(t => t.sprintId === sprintId).map(t => t.id));
  res.json(dependencies.filter(d => taskIds.has(d.fromTaskId) && taskIds.has(d.toTaskId)));
});

app.post('/api/dependencies', (req, res) => {
  if (dependencies.some(d => d.fromTaskId === req.body.fromTaskId && d.toTaskId === req.body.toTaskId)) {
    return res.status(400).json({ error: 'Dependency already exists' });
  }
  const dep = { id: genId(), fromTaskId: req.body.fromTaskId, toTaskId: req.body.toTaskId };
  dependencies.push(dep);
  io.emit('dep:added', dep);
  res.json(dep);
});

app.delete('/api/dependencies/:id', (req, res) => {
  const idx = dependencies.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Dependency not found' });
  const [removed] = dependencies.splice(idx, 1);
  io.emit('dep:removed', { id: removed.id });
  res.json({ success: true });
});

app.get('/api/comments', (req, res) => {
  const taskId = req.query.taskId;
  res.json(taskId ? comments.filter(c => c.taskId === taskId) : comments);
});

app.post('/api/comments', (req, res) => {
  const comment = { id: genId(), ...req.body, timestamp: Date.now() };
  comments.push(comment);
  res.json(comment);
});

app.get('/api/votes', (req, res) => {
  const sprintId = req.query.sprintId || 's1';
  const taskIds = new Set(tasks.filter(t => t.sprintId === sprintId && t.lane === 'done').map(t => t.id));
  res.json(votes.filter(v => taskIds.has(v.taskId)));
});

app.post('/api/votes', (req, res) => {
  const existingIdx = votes.findIndex(v => v.taskId === req.body.taskId && v.voter === req.body.voter);
  if (existingIdx >= 0) {
    votes[existingIdx] = { ...votes[existingIdx], emoji: req.body.emoji };
  } else {
    votes.push({ taskId: req.body.taskId, voter: req.body.voter, emoji: req.body.emoji });
  }
  res.json({ success: true });
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json([]);
  res.json(tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    teamMembers.find(m => m.id === t.assignee)?.name.toLowerCase().includes(q)
  ));
});

app.get('/api/team', (req, res) => {
  const memberStats = teamMembers.map(m => {
    const memberTasks = tasks.filter(t => t.assignee === m.id && t.lane !== 'done');
    return { ...m, taskCount: memberTasks.length, totalHours: memberTasks.reduce((s, t) => s + t.remainingHours, 0) };
  });
  res.json(memberStats);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('task:move', (data) => {
    const task = tasks.find(t => t.id === data.id);
    if (!task) return;
    task.lane = data.lane;
    task.order = data.order;
    if (data.lane === 'done') task.remainingHours = 0;
    io.emit('task:moved', task);
  });

  socket.on('task:create', (data) => {
    const task = { id: genId(), order: tasks.filter(t => t.lane === data.lane).length, ...data, sprintId: data.sprintId || 's1' };
    tasks.push(task);
    io.emit('task:created', task);
  });

  socket.on('task:update', (data) => {
    const idx = tasks.findIndex(t => t.id === data.id);
    if (idx === -1) return;
    tasks[idx] = { ...tasks[idx], ...data };
    io.emit('task:updated', tasks[idx]);
  });

  socket.on('task:delete', (data) => {
    const idx = tasks.findIndex(t => t.id === data.id);
    if (idx === -1) return;
    tasks.splice(idx, 1);
    io.emit('task:deleted', { id: data.id });
  });

  socket.on('dep:add', (data) => {
    if (dependencies.some(d => d.fromTaskId === data.fromTaskId && d.toTaskId === data.toTaskId)) return;
    const dep = { id: genId(), fromTaskId: data.fromTaskId, toTaskId: data.toTaskId };
    dependencies.push(dep);
    io.emit('dep:added', dep);
  });

  socket.on('dep:remove', (data) => {
    const idx = dependencies.findIndex(d => d.id === data.id);
    if (idx === -1) return;
    dependencies.splice(idx, 1);
    io.emit('dep:removed', { id: data.id });
  });

  socket.on('member:join', (data) => {
    const member = teamMembers.find(m => m.id === data.memberId);
    if (member) { member.online = true; }
    io.emit('member:joined', { id: data.memberId });
  });

  socket.on('member:leave', (data) => {
    const member = teamMembers.find(m => m.id === data.memberId);
    if (member) { member.online = false; }
    io.emit('member:left', { id: data.memberId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`SprintFlow server running on port ${PORT}`);
});
