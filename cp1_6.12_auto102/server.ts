import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Task, TaskStatus, Priority } from './src/types';

const app = express();
app.use(cors());
app.use(express.json());

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
];

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: '产品迭代 V2.0',
    ownerName: '张伟',
    ownerAvatar: AVATARS[0],
    tasks: [
      { id: 't1', projectId: 'p1', title: '完成登录模块重构', description: '使用新的认证架构重写登录流程', dueDate: '2026-06-20', priority: 'high', status: 'in_progress', order: 0 },
      { id: 't2', projectId: 'p1', title: '优化首页加载速度', description: '图片懒加载、代码分割', dueDate: '2026-06-25', priority: 'medium', status: 'todo', order: 1 },
      { id: 't3', projectId: 'p1', title: '编写单元测试', description: '核心模块覆盖率达到80%', dueDate: '2026-06-30', priority: 'low', status: 'todo', order: 2 },
      { id: 't4', projectId: 'p1', title: 'API文档更新', description: '同步Swagger文档', dueDate: '2026-06-15', priority: 'medium', status: 'completed', order: 3 },
    ],
  },
  {
    id: 'p2',
    name: '营销活动系统',
    ownerName: '李娜',
    ownerAvatar: AVATARS[1],
    tasks: [
      { id: 't5', projectId: 'p2', title: '活动页面设计稿评审', description: '与设计团队确认最终稿', dueDate: '2026-06-14', priority: 'high', status: 'completed', order: 0 },
      { id: 't6', projectId: 'p2', title: '优惠券功能开发', description: '支持满减、折扣两种类型', dueDate: '2026-06-22', priority: 'high', status: 'in_progress', order: 1 },
      { id: 't7', projectId: 'p2', title: '数据埋点接入', description: '接入用户行为分析平台', dueDate: '2026-06-28', priority: 'medium', status: 'todo', order: 2 },
    ],
  },
  {
    id: 'p3',
    name: '客户后台系统',
    ownerName: '王强',
    ownerAvatar: AVATARS[2],
    tasks: [
      { id: 't8', projectId: 'p3', title: '数据报表导出', description: '支持Excel、CSV格式', dueDate: '2026-06-18', priority: 'medium', status: 'todo', order: 0 },
      { id: 't9', projectId: 'p3', title: '权限管理模块', description: 'RBAC细粒度权限控制', dueDate: '2026-07-05', priority: 'high', status: 'in_progress', order: 1 },
      { id: 't10', projectId: 'p3', title: '日志查询优化', description: 'Elasticsearch索引优化', dueDate: '2026-06-30', priority: 'low', status: 'todo', order: 2 },
      { id: 't11', projectId: 'p3', title: '消息中心开发', description: '站内信、邮件、短信通知', dueDate: '2026-07-10', priority: 'medium', status: 'todo', order: 3 },
      { id: 't12', projectId: 'p3', title: '数据库迁移脚本', description: 'PostgreSQL版本升级', dueDate: '2026-06-16', priority: 'high', status: 'completed', order: 4 },
    ],
  },
  {
    id: 'p4',
    name: '移动App适配',
    ownerName: '刘芳',
    ownerAvatar: AVATARS[3],
    tasks: [
      { id: 't13', projectId: 'p4', title: 'iOS端推送测试', description: 'APNs证书配置', dueDate: '2026-06-19', priority: 'high', status: 'todo', order: 0 },
      { id: 't14', projectId: 'p4', title: 'Android兼容性修复', description: '低版本系统适配', dueDate: '2026-06-24', priority: 'medium', status: 'in_progress', order: 1 },
    ],
  },
  {
    id: 'p5',
    name: '基础设施升级',
    ownerName: '陈明',
    ownerAvatar: AVATARS[4],
    tasks: [
      { id: 't15', projectId: 'p5', title: 'K8s集群扩容', description: '节点从5台增加到10台', dueDate: '2026-07-01', priority: 'medium', status: 'todo', order: 0 },
      { id: 't16', projectId: 'p5', title: '监控告警完善', description: 'Prometheus + Grafana', dueDate: '2026-06-26', priority: 'high', status: 'in_progress', order: 1 },
      { id: 't17', projectId: 'p5', title: 'CI/CD流水线优化', description: '构建时间缩短50%', dueDate: '2026-07-08', priority: 'low', status: 'todo', order: 2 },
      { id: 't18', projectId: 'p5', title: 'SSL证书轮换', description: '所有域名证书更新', dueDate: '2026-06-13', priority: 'high', status: 'completed', order: 3 },
    ],
  },
];

app.get('/api/projects', (_req: Request, res: Response<Project[]>) => {
  res.json(mockProjects);
});

app.get('/api/projects/:id', (req: Request, res: Response<Project | { error: string }>) => {
  const project = mockProjects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

app.post('/api/tasks', (req: Request, res: Response<Task>) => {
  const { projectId, title, description, dueDate, priority } = req.body as {
    projectId: string; title: string; description: string; dueDate: string; priority: Priority;
  };
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) return res.status(404).end();
  const newTask: Task = {
    id: uuidv4(),
    projectId,
    title,
    description,
    dueDate,
    priority,
    status: 'todo',
    order: project.tasks.length,
  };
  project.tasks.push(newTask);
  res.status(201).json(newTask);
});

app.patch('/api/tasks/:id/status', (req: Request, res: Response<Task | { error: string }>) => {
  const { status } = req.body as { status: TaskStatus };
  for (const p of mockProjects) {
    const task = p.tasks.find(t => t.id === req.params.id);
    if (task) {
      task.status = status;
      return res.json(task);
    }
  }
  res.status(404).json({ error: 'Task not found' });
});

app.post('/api/tasks/reorder', (req: Request, res: Response<void>) => {
  const { projectId, taskIds } = req.body as { projectId: string; taskIds: string[] };
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) return res.status(404).end();
  taskIds.forEach((id, index) => {
    const task = project.tasks.find(t => t.id === id);
    if (task) task.order = index;
  });
  res.status(200).end();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
