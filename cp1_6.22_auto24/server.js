import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const boards = new Map();

const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const seedData = () => {
  const demoBoardId = uuidv4();
  const tasks = [
    {
      id: uuidv4(),
      title: '设计用户登录界面',
      description: '设计一个简洁美观的用户登录界面，包含邮箱、密码输入框和登录按钮。需要考虑移动端适配和表单验证。',
      assignee: '张三',
      priority: 'high',
      dueDate: '2025-01-20',
      status: 'todo',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '开发用户注册API',
      description: '实现用户注册接口，包括参数校验、密码加密、邮箱验证等功能。',
      assignee: '李四',
      priority: 'medium',
      dueDate: '2025-01-22',
      status: 'todo',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '优化首页加载性能',
      description: '通过代码分割、图片懒加载等技术优化首页加载速度，目标是首屏加载时间小于2秒。',
      assignee: '王五',
      priority: 'high',
      dueDate: '2025-01-18',
      status: 'inProgress',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '编写单元测试',
      description: '为核心业务逻辑编写单元测试，覆盖率达到80%以上。',
      assignee: '赵六',
      priority: 'low',
      dueDate: '2025-01-25',
      status: 'inProgress',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '完成项目需求文档',
      description: '整理并完善项目需求文档，包括功能描述、用户故事、验收标准等。',
      assignee: '张三',
      priority: 'medium',
      dueDate: '2025-01-15',
      status: 'done',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '配置CI/CD流水线',
      description: '配置自动化构建和部署流水线，实现代码提交后自动测试、构建和部署。',
      assignee: '李四',
      priority: 'high',
      dueDate: '2025-01-12',
      status: 'done',
      createdAt: new Date().toISOString(),
    },
  ];

  const tasksMap = new Map();
  tasks.forEach((task) => tasksMap.set(task.id, task));

  boards.set(demoBoardId, {
    id: demoBoardId,
    name: '项目开发看板',
    createdAt: new Date().toISOString(),
    tasks: tasksMap,
  });
};

seedData();

app.get('/api/boards', (req, res) => {
  const boardList = Array.from(boards.values()).map((board) => ({
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
  }));
  res.json(boardList);
});

app.post('/api/boards', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: '看板名称不能为空' });
  }

  const boardId = uuidv4();
  const newBoard = {
    id: boardId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    tasks: new Map(),
  };

  boards.set(boardId, newBoard);

  res.json({
    id: newBoard.id,
    name: newBoard.name,
    createdAt: newBoard.createdAt,
  });
});

app.get('/api/boards/:id', (req, res) => {
  const { id } = req.params;
  const board = boards.get(id);

  if (!board) {
    return res.status(404).json({ error: '看板不存在' });
  }

  const tasks = Array.from(board.tasks.values());
  res.json({
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    tasks,
  });
});

app.delete('/api/boards/:id', (req, res) => {
  const { id } = req.params;
  if (!boards.has(id)) {
    return res.status(404).json({ error: '看板不存在' });
  }

  boards.delete(id);
  res.json({ success: true });
});

app.post('/api/boards/:id/tasks', (req, res) => {
  const { id } = req.params;
  const board = boards.get(id);

  if (!board) {
    return res.status(404).json({ error: '看板不存在' });
  }

  const { title, description, assignee, priority, dueDate, status } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: '任务标题不能为空' });
  }
  if (!assignee || !assignee.trim()) {
    return res.status(400).json({ error: '负责人不能为空' });
  }
  if (!['high', 'medium', 'low'].includes(priority)) {
    return res.status(400).json({ error: '优先级无效' });
  }
  if (!['todo', 'inProgress', 'done'].includes(status)) {
    return res.status(400).json({ error: '状态无效' });
  }

  const taskId = uuidv4();
  const newTask = {
    id: taskId,
    title: title.trim(),
    description: description || '',
    assignee: assignee.trim(),
    priority,
    dueDate: dueDate || '',
    status,
    createdAt: new Date().toISOString(),
  };

  board.tasks.set(taskId, newTask);
  res.json(newTask);
});

app.put('/api/boards/:id/tasks/:taskId', (req, res) => {
  const { id, taskId } = req.params;
  const board = boards.get(id);

  if (!board) {
    return res.status(404).json({ error: '看板不存在' });
  }

  const task = board.tasks.get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const { title, description, assignee, priority, dueDate, status } = req.body;

  if (status && !['todo', 'inProgress', 'done'].includes(status)) {
    return res.status(400).json({ error: '状态无效' });
  }
  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    return res.status(400).json({ error: '优先级无效' });
  }

  const updatedTask = {
    ...task,
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description }),
    ...(assignee !== undefined && { assignee: assignee.trim() }),
    ...(priority !== undefined && { priority }),
    ...(dueDate !== undefined && { dueDate }),
    ...(status !== undefined && { status }),
  };

  board.tasks.set(taskId, updatedTask);
  res.json(updatedTask);
});

app.delete('/api/boards/:id/tasks/:taskId', (req, res) => {
  const { id, taskId } = req.params;
  const board = boards.get(id);

  if (!board) {
    return res.status(404).json({ error: '看板不存在' });
  }

  if (!board.tasks.has(taskId)) {
    return res.status(404).json({ error: '任务不存在' });
  }

  board.tasks.delete(taskId);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
