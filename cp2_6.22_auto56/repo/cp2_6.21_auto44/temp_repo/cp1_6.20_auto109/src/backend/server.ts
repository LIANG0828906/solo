import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}

type TaskStatus = 'todo' | 'in-progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  startDate?: string;
}

interface AppData {
  tasks: Task[];
  teamMembers: TeamMember[];
}

const defaultTeamMembers: TeamMember[] = [
  { id: '1', name: '张伟', role: '产品经理', avatarColor: '#FF6B6B' },
  { id: '2', name: '李娜', role: '前端工程师', avatarColor: '#4ECDC4' },
  { id: '3', name: '王强', role: '后端工程师', avatarColor: '#45B7D1' },
  { id: '4', name: '刘芳', role: 'UI设计师', avatarColor: '#96CEB4' },
  { id: '5', name: '陈明', role: '测试工程师', avatarColor: '#FFEAA7' },
];

const defaultTasks: Task[] = [
  {
    id: 't1',
    title: '设计登录页面UI',
    description: '完成登录页面的视觉设计，包括表单、按钮和错误提示',
    assigneeId: '4',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-06-25',
    createdAt: '2026-06-18',
    startDate: '2026-06-20',
  },
  {
    id: 't2',
    title: '实现用户认证API',
    description: '开发登录、注册和JWT验证接口',
    assigneeId: '3',
    priority: 'urgent',
    status: 'in-progress',
    dueDate: '2026-06-22',
    createdAt: '2026-06-15',
    startDate: '2026-06-18',
  },
  {
    id: 't3',
    title: '编写产品需求文档',
    description: '整理用户需求，输出详细的PRD文档',
    assigneeId: '1',
    priority: 'medium',
    status: 'done',
    dueDate: '2026-06-17',
    createdAt: '2026-06-10',
    completedAt: '2026-06-16',
    startDate: '2026-06-12',
  },
  {
    id: 't4',
    title: '开发任务看板组件',
    description: '使用React和dnd库实现可拖拽的看板',
    assigneeId: '2',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2026-06-28',
    createdAt: '2026-06-17',
    startDate: '2026-06-19',
  },
  {
    id: 't5',
    title: '单元测试覆盖率提升',
    description: '将核心模块的单元测试覆盖率提升到80%以上',
    assigneeId: '5',
    priority: 'low',
    status: 'todo',
    dueDate: '2026-07-05',
    createdAt: '2026-06-19',
    startDate: '2026-06-25',
  },
  {
    id: 't6',
    title: '响应式布局优化',
    description: '优化移动端和平板设备的显示效果',
    assigneeId: '2',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-06-30',
    createdAt: '2026-06-18',
    startDate: '2026-06-26',
  },
  {
    id: 't7',
    title: '数据库架构设计',
    description: '设计用户、任务、项目等核心表结构',
    assigneeId: '3',
    priority: 'medium',
    status: 'done',
    dueDate: '2026-06-15',
    createdAt: '2026-06-08',
    completedAt: '2026-06-14',
    startDate: '2026-06-10',
  },
];

function readData(): AppData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading data file:', e);
  }
  return { tasks: defaultTasks, teamMembers: defaultTeamMembers };
}

function writeData(data: AppData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing data file:', e);
  }
}

app.get('/api/tasks', (req, res) => {
  const data = readData();
  res.json(data.tasks);
});

app.get('/api/team-members', (req, res) => {
  const data = readData();
  res.json(data.teamMembers);
});

app.post('/api/tasks', (req, res) => {
  const data = readData();
  const newTask: Task = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description || '',
    assigneeId: req.body.assigneeId,
    priority: req.body.priority || 'medium',
    status: 'todo',
    dueDate: req.body.dueDate,
    createdAt: new Date().toISOString().split('T')[0],
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
  };
  data.tasks.push(newTask);
  writeData(data);
  res.json(data.tasks);
});

app.put('/api/tasks/:id', (req, res) => {
  const data = readData();
  const taskIndex = data.tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...req.body };
  writeData(data);
  res.json(data.tasks);
});

app.patch('/api/tasks/:id/status', (req, res) => {
  const data = readData();
  const taskIndex = data.tasks.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const newStatus: TaskStatus = req.body.status;
  data.tasks[taskIndex].status = newStatus;
  if (newStatus === 'done' && !data.tasks[taskIndex].completedAt) {
    data.tasks[taskIndex].completedAt = new Date().toISOString();
  } else if (newStatus !== 'done') {
    delete data.tasks[taskIndex].completedAt;
  }
  if (newStatus === 'in-progress' && !data.tasks[taskIndex].startDate) {
    data.tasks[taskIndex].startDate = new Date().toISOString().split('T')[0];
  }
  writeData(data);
  res.json(data.tasks);
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = readData();
  data.tasks = data.tasks.filter((t) => t.id !== req.params.id);
  writeData(data);
  res.json(data.tasks);
});

app.post('/api/tasks/reorder', (req, res) => {
  const data = readData();
  const { taskId, sourceStatus, destinationStatus, destinationIndex } = req.body;
  
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const sourceTasks = data.tasks.filter((t) => t.status === sourceStatus);
  const destTasks = data.tasks.filter((t) => t.status === destinationStatus);
  
  const taskToMove = sourceTasks.find((t) => t.id === taskId);
  if (!taskToMove) {
    res.status(404).json({ error: 'Task not found in source column' });
    return;
  }

  if (sourceStatus === destinationStatus) {
    const orderedTasks = [...sourceTasks];
    const currentIndex = orderedTasks.findIndex((t) => t.id === taskId);
    if (currentIndex > -1) {
      orderedTasks.splice(currentIndex, 1);
    }
    orderedTasks.splice(destinationIndex, 0, taskToMove);
    
    const otherTasks = data.tasks.filter((t) => t.status !== sourceStatus);
    data.tasks = [...otherTasks, ...orderedTasks];
  } else {
    taskToMove.status = destinationStatus;
    if (destinationStatus === 'done' && !taskToMove.completedAt) {
      taskToMove.completedAt = new Date().toISOString();
    } else if (destinationStatus !== 'done') {
      delete taskToMove.completedAt;
    }
    if (destinationStatus === 'in-progress' && !taskToMove.startDate) {
      taskToMove.startDate = new Date().toISOString().split('T')[0];
    }

    const newSourceTasks = sourceTasks.filter((t) => t.id !== taskId);
    const newDestTasks = [...destTasks];
    newDestTasks.splice(destinationIndex, 0, taskToMove);
    
    const otherTasks = data.tasks.filter(
      (t) => t.status !== sourceStatus && t.status !== destinationStatus
    );
    data.tasks = [...otherTasks, ...newSourceTasks, ...newDestTasks];
  }

  writeData(data);
  res.json(data.tasks);
});

app.get('/api/stats', (req, res) => {
  const data = readData();
  const stats = data.teamMembers.map((member) => {
    const memberTasks = data.tasks.filter((t) => t.assigneeId === member.id);
    const overdueTasks = memberTasks.filter(
      (t) => t.status !== 'done' && new Date(t.dueDate) < new Date()
    );
    return {
      memberId: member.id,
      memberName: member.name,
      avatarColor: member.avatarColor,
      totalTasks: memberTasks.length,
      todo: memberTasks.filter((t) => t.status === 'todo').length,
      inProgress: memberTasks.filter((t) => t.status === 'in-progress').length,
      done: memberTasks.filter((t) => t.status === 'done').length,
      overdue: overdueTasks.length,
    };
  });
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
