import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Task, Dependency, TaskStatus, Milestone } from '../types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let milestones: Milestone[] = [
  {
    id: 'm1',
    name: '需求评审',
    description: '完成需求分析并通过评审',
    date: '2026-06-17',
  },
  {
    id: 'm2',
    name: '设计完成',
    description: 'UI/UX 设计全部完成',
    date: '2026-06-20',
  },
  {
    id: 'm3',
    name: '产品上线',
    description: '正式发布上线',
    date: '2026-06-30',
  },
];

let tasks: Task[] = [
  {
    id: '1',
    title: '需求分析',
    description: '与客户沟通，梳理项目需求',
    status: 'done',
    startDate: '2026-06-15',
    endDate: '2026-06-17',
    progress: 100,
    dependencies: [],
    attachments: [],
  },
  {
    id: '2',
    title: 'UI 设计',
    description: '设计整体界面和交互原型',
    status: 'done',
    startDate: '2026-06-18',
    endDate: '2026-06-20',
    progress: 100,
    dependencies: ['1'],
    attachments: [],
  },
  {
    id: '3',
    title: '前端开发',
    description: '使用 React 实现前端界面',
    status: 'in-progress',
    startDate: '2026-06-21',
    endDate: '2026-06-25',
    progress: 50,
    dependencies: ['2'],
    attachments: [],
  },
  {
    id: '4',
    title: '后端开发',
    description: '搭建 API 服务和数据库',
    status: 'in-progress',
    startDate: '2026-06-21',
    endDate: '2026-06-26',
    progress: 30,
    dependencies: ['2'],
    attachments: [],
  },
  {
    id: '5',
    title: '测试与上线',
    description: '功能测试、性能优化和部署',
    status: 'todo',
    startDate: '2026-06-27',
    endDate: '2026-06-30',
    progress: 0,
    dependencies: ['3', '4'],
    attachments: [],
  },
  {
    id: '6',
    title: '文档编写',
    description: '编写项目文档和使用说明',
    status: 'todo',
    startDate: '2026-06-25',
    endDate: '2026-06-28',
    progress: 0,
    dependencies: ['3'],
    attachments: [],
  },
];

let dependencies: Dependency[] = [
  { id: 'd1', fromTaskId: '1', toTaskId: '2' },
  { id: 'd2', fromTaskId: '2', toTaskId: '3' },
  { id: 'd3', fromTaskId: '2', toTaskId: '4' },
  { id: 'd4', fromTaskId: '3', toTaskId: '5' },
  { id: 'd5', fromTaskId: '4', toTaskId: '5' },
  { id: 'd6', fromTaskId: '3', toTaskId: '6' },
];

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask: Task = {
    id: uuidv4(),
    title: req.body.title || '新任务',
    description: req.body.description || '',
    status: (req.body.status as TaskStatus) || 'todo',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: req.body.progress || 0,
    dependencies: req.body.dependencies || [],
    attachments: req.body.attachments || [],
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body, id: taskId };
  res.json(tasks[taskIndex]);
});

app.get('/api/dependencies', (req, res) => {
  res.json(dependencies);
});

app.post('/api/dependencies', (req, res) => {
  const { fromTaskId, toTaskId } = req.body;
  if (!fromTaskId || !toTaskId) {
    res.status(400).json({ error: 'fromTaskId and toTaskId are required' });
    return;
  }
  const exists = dependencies.some(
    (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
  );
  if (exists) {
    res.status(409).json({ error: 'Dependency already exists' });
    return;
  }
  const newDep: Dependency = {
    id: uuidv4(),
    fromTaskId,
    toTaskId,
  };
  dependencies.push(newDep);
  res.status(201).json(newDep);
});

app.get('/api/milestones', (req, res) => {
  res.json(milestones);
});

app.post('/api/milestones', (req, res) => {
  const newMilestone: Milestone = {
    id: uuidv4(),
    name: req.body.name || '新里程碑',
    description: req.body.description || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
  };
  milestones.push(newMilestone);
  res.status(201).json(newMilestone);
});

app.put('/api/milestones/:id', (req, res) => {
  const milestoneId = req.params.id;
  const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
  if (milestoneIndex === -1) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  milestones[milestoneIndex] = { ...milestones[milestoneIndex], ...req.body, id: milestoneId };
  res.json(milestones[milestoneIndex]);
});

app.delete('/api/milestones/:id', (req, res) => {
  const milestoneId = req.params.id;
  const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
  if (milestoneIndex === -1) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  milestones.splice(milestoneIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
