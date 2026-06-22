import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Task, Milestone } from '../shared/types';

const router = express.Router();

export const projects = new Map<string, Project>();
export const tasks = new Map<string, Task>();
export const milestones = new Map<string, Milestone>();

const AVATAR_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac'];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function initMockData() {
  const projectId1 = uuidv4();
  const projectId2 = uuidv4();

  projects.set(projectId1, {
    id: projectId1,
    name: '产品官网重构',
    description: '公司官网全面升级改版项目',
    ownerId: 'user-1',
    ownerName: '张三',
    deadline: '2026-08-15',
    avatarColor: '#64b5f6',
    createdAt: new Date().toISOString()
  });

  projects.set(projectId2, {
    id: projectId2,
    name: '移动端App开发',
    description: '新一代移动应用开发项目',
    ownerId: 'user-2',
    ownerName: '李四',
    deadline: '2026-09-30',
    avatarColor: '#81c784',
    createdAt: new Date().toISOString()
  });

  const task1 = uuidv4();
  const task2 = uuidv4();
  const task3 = uuidv4();
  const task4 = uuidv4();
  const task5 = uuidv4();
  const task6 = uuidv4();

  tasks.set(task1, {
    id: task1,
    projectId: projectId1,
    name: '需求分析与调研',
    status: 'completed',
    priority: 'high',
    assignee: 'user-1',
    assigneeName: '张三',
    startDate: '2026-06-01',
    endDate: '2026-06-10',
    dependencies: [],
    dependents: [task2]
  });

  tasks.set(task2, {
    id: task2,
    projectId: projectId1,
    name: 'UI/UX设计',
    status: 'in-progress',
    priority: 'high',
    assignee: 'user-3',
    assigneeName: '王五',
    startDate: '2026-06-11',
    endDate: '2026-06-25',
    dependencies: [task1],
    dependents: [task3]
  });

  tasks.set(task3, {
    id: task3,
    projectId: projectId1,
    name: '前端开发',
    status: 'todo',
    priority: 'high',
    assignee: 'user-4',
    assigneeName: '赵六',
    startDate: '2026-06-26',
    endDate: '2026-07-20',
    dependencies: [task2],
    dependents: [task5]
  });

  tasks.set(task4, {
    id: task4,
    projectId: projectId1,
    name: '后端API开发',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'user-5',
    assigneeName: '钱七',
    startDate: '2026-06-15',
    endDate: '2026-07-10',
    dependencies: [],
    dependents: [task5]
  });

  tasks.set(task5, {
    id: task5,
    projectId: projectId1,
    name: '系统集成测试',
    status: 'todo',
    priority: 'medium',
    assignee: 'user-6',
    assigneeName: '孙八',
    startDate: '2026-07-21',
    endDate: '2026-08-05',
    dependencies: [task3, task4],
    dependents: [task6]
  });

  tasks.set(task6, {
    id: task6,
    projectId: projectId1,
    name: '部署上线',
    status: 'todo',
    priority: 'high',
    assignee: 'user-1',
    assigneeName: '张三',
    startDate: '2026-08-06',
    endDate: '2026-08-15',
    dependencies: [task5],
    dependents: []
  });

  const milestone1 = uuidv4();
  const milestone2 = uuidv4();

  milestones.set(milestone1, {
    id: milestone1,
    projectId: projectId1,
    name: 'Alpha版本',
    date: '2026-07-20',
    completed: false,
    taskIds: [task1, task2, task3, task4]
  });

  milestones.set(milestone2, {
    id: milestone2,
    projectId: projectId1,
    name: 'Beta发布',
    date: '2026-08-15',
    completed: false,
    taskIds: [task5, task6]
  });

  const task7 = uuidv4();
  const task8 = uuidv4();

  tasks.set(task7, {
    id: task7,
    projectId: projectId2,
    name: '产品原型设计',
    status: 'completed',
    priority: 'high',
    assignee: 'user-2',
    assigneeName: '李四',
    startDate: '2026-06-05',
    endDate: '2026-06-18',
    dependencies: [],
    dependents: [task8]
  });

  tasks.set(task8, {
    id: task8,
    projectId: projectId2,
    name: '核心功能开发',
    status: 'in-progress',
    priority: 'high',
    assignee: 'user-3',
    assigneeName: '王五',
    startDate: '2026-06-19',
    endDate: '2026-08-30',
    dependencies: [task7],
    dependents: []
  });
}

initMockData();

router.get('/projects', (req, res) => {
  const projectList = Array.from(projects.values()).map(project => {
    const projectTasks = Array.from(tasks.values()).filter(t => t.projectId === project.id);
    const completedCount = projectTasks.filter(t => t.status === 'completed').length;
    return {
      ...project,
      taskCount: projectTasks.length,
      completedCount
    };
  });
  res.json(projectList);
});

router.get('/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

router.post('/projects', (req, res) => {
  const { name, description, ownerId, ownerName, deadline } = req.body;
  const id = uuidv4();
  const project: Project = {
    id,
    name,
    description,
    ownerId,
    ownerName,
    deadline,
    avatarColor: getRandomColor(),
    createdAt: new Date().toISOString()
  };
  projects.set(id, project);
  res.status(201).json({ ...project, taskCount: 0, completedCount: 0 });
});

router.get('/projects/:projectId/tasks', (req, res) => {
  const projectTasks = Array.from(tasks.values()).filter(
    t => t.projectId === req.params.projectId
  );
  res.json(projectTasks);
});

router.get('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

router.post('/tasks', (req, res) => {
  const { projectId, name, priority, assignee, assigneeName, startDate, endDate } = req.body;
  const id = uuidv4();
  const task: Task = {
    id,
    projectId,
    name,
    status: 'todo',
    priority: priority || 'medium',
    assignee,
    assigneeName,
    startDate,
    endDate,
    dependencies: [],
    dependents: []
  };
  tasks.set(id, task);
  res.status(201).json(task);
});

router.put('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  const updatedTask = { ...task, ...req.body, id: task.id, projectId: task.projectId };
  tasks.set(task.id, updatedTask);
  res.json(updatedTask);
});

router.delete('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  task.dependencies.forEach(depId => {
    const depTask = tasks.get(depId);
    if (depTask) {
      depTask.dependents = depTask.dependents.filter(d => d !== task.id);
      tasks.set(depId, depTask);
    }
  });
  
  task.dependents.forEach(depId => {
    const depTask = tasks.get(depId);
    if (depTask) {
      depTask.dependencies = depTask.dependencies.filter(d => d !== task.id);
      tasks.set(depId, depTask);
    }
  });
  
  tasks.delete(task.id);
  res.json({ success: true });
});

router.post('/tasks/:taskId/dependencies/:depTaskId', (req, res) => {
  const task = tasks.get(req.params.taskId);
  const depTask = tasks.get(req.params.depTaskId);
  
  if (!task || !depTask) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.dependencies.includes(depTask.id) || depTask.dependencies.includes(task.id)) {
    return res.status(400).json({ error: '依赖关系已存在或会造成循环依赖' });
  }
  
  task.dependencies.push(depTask.id);
  depTask.dependents.push(task.id);
  tasks.set(task.id, task);
  tasks.set(depTask.id, depTask);
  
  res.json({ task, depTask });
});

router.get('/projects/:projectId/milestones', (req, res) => {
  const projectMilestones = Array.from(milestones.values()).filter(
    m => m.projectId === req.params.projectId
  );
  res.json(projectMilestones);
});

router.post('/milestones', (req, res) => {
  const { projectId, name, date, taskIds } = req.body;
  const id = uuidv4();
  const milestone: Milestone = {
    id,
    projectId,
    name,
    date,
    completed: false,
    taskIds: taskIds || []
  };
  milestones.set(id, milestone);
  res.status(201).json(milestone);
});

router.put('/milestones/:id', (req, res) => {
  const milestone = milestones.get(req.params.id);
  if (!milestone) {
    return res.status(404).json({ error: '里程碑不存在' });
  }
  const updated = { ...milestone, ...req.body, id: milestone.id, projectId: milestone.projectId };
  milestones.set(milestone.id, updated);
  res.json(updated);
});

export default router;
