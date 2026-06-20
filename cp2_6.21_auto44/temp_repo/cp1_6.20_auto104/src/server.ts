import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { AppData, Project, Milestone, Task, Asset, WsMessage } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'data.json');

const defaultData: AppData = {
  projects: [
    {
      id: 'proj-1',
      name: '星际远征',
      engine: 'Unity',
      platforms: ['PC', 'Console'],
      releaseDate: '2026-12-15',
      description: '一款太空探索策略游戏，玩家将在浩瀚星系中建立帝国、管理资源和指挥舰队。',
      createdAt: '2026-01-10',
    },
    {
      id: 'proj-2',
      name: 'Shadow Blade',
      engine: 'Unreal',
      platforms: ['PC', 'Mobile'],
      releaseDate: '2026-09-01',
      description: '快节奏暗黑风动作RPG，融合精确战斗与深度角色培养系统。',
      createdAt: '2025-11-20',
    },
    {
      id: 'proj-3',
      name: '像素农场物语',
      engine: 'Godot',
      platforms: ['Mobile', 'PC'],
      releaseDate: '2026-06-30',
      description: '温馨的像素风农场模拟游戏，种植作物、养殖动物、与村民互动。',
      createdAt: '2025-09-05',
    },
    {
      id: 'proj-4',
      name: 'MechaForge',
      engine: 'Unity',
      platforms: ['PC'],
      releaseDate: '2027-03-20',
      description: '机甲组装与对战游戏，自由设计机甲并参与多人竞技战斗。',
      createdAt: '2026-03-01',
    },
  ],
  milestones: [
    { id: 'ms-1-1', projectId: 'proj-1', name: 'Alpha', startDate: '2026-03-01', endDate: '2026-05-31', status: 'completed' },
    { id: 'ms-1-2', projectId: 'proj-1', name: 'Beta', startDate: '2026-06-01', endDate: '2026-08-31', status: 'in_progress' },
    { id: 'ms-1-3', projectId: 'proj-1', name: 'RC', startDate: '2026-09-01', endDate: '2026-11-15', status: 'planning' },
    { id: 'ms-1-4', projectId: 'proj-1', name: '发布', startDate: '2026-11-16', endDate: '2026-12-15', status: 'planning' },
    { id: 'ms-2-1', projectId: 'proj-2', name: 'Alpha', startDate: '2026-01-01', endDate: '2026-03-31', status: 'completed' },
    { id: 'ms-2-2', projectId: 'proj-2', name: 'Beta', startDate: '2026-04-01', endDate: '2026-06-30', status: 'in_progress' },
    { id: 'ms-2-3', projectId: 'proj-2', name: 'RC', startDate: '2026-07-01', endDate: '2026-08-15', status: 'frozen' },
    { id: 'ms-2-4', projectId: 'proj-2', name: '发布', startDate: '2026-08-16', endDate: '2026-09-01', status: 'planning' },
    { id: 'ms-3-1', projectId: 'proj-3', name: 'Alpha', startDate: '2025-12-01', endDate: '2026-02-28', status: 'completed' },
    { id: 'ms-3-2', projectId: 'proj-3', name: 'Beta', startDate: '2026-03-01', endDate: '2026-05-15', status: 'completed' },
    { id: 'ms-3-3', projectId: 'proj-3', name: 'RC', startDate: '2026-05-16', endDate: '2026-06-20', status: 'in_progress' },
    { id: 'ms-3-4', projectId: 'proj-3', name: '发布', startDate: '2026-06-21', endDate: '2026-06-30', status: 'planning' },
    { id: 'ms-4-1', projectId: 'proj-4', name: '原型', startDate: '2026-04-01', endDate: '2026-06-30', status: 'in_progress' },
    { id: 'ms-4-2', projectId: 'proj-4', name: 'Alpha', startDate: '2026-07-01', endDate: '2026-10-31', status: 'planning' },
    { id: 'ms-4-3', projectId: 'proj-4', name: 'Beta', startDate: '2026-11-01', endDate: '2027-01-31', status: 'planning' },
    { id: 'ms-4-4', projectId: 'proj-4', name: '发布', startDate: '2027-02-01', endDate: '2027-03-20', status: 'planning' },
  ],
  tasks: [
    { id: 't-1', milestoneId: 'ms-1-2', projectId: 'proj-1', title: '实现星系地图导航系统', priority: 'high', estimatedHours: 40, assignee: '张伟', taskType: 'programming', status: 'in_progress', assetIds: ['a-1'] },
    { id: 't-2', milestoneId: 'ms-1-2', projectId: 'proj-1', title: '设计舰队指挥UI界面', priority: 'medium', estimatedHours: 24, assignee: '李芳', taskType: 'art', status: 'in_progress', assetIds: ['a-2'] },
    { id: 't-3', milestoneId: 'ms-1-2', projectId: 'proj-1', title: '编写资源采集逻辑', priority: 'high', estimatedHours: 32, assignee: '王磊', taskType: 'programming', status: 'testing', assetIds: [] },
    { id: 't-4', milestoneId: 'ms-1-2', projectId: 'proj-1', title: '制作太空环境音效', priority: 'low', estimatedHours: 16, assignee: null, taskType: 'audio', status: 'unassigned', assetIds: [] },
    { id: 't-5', milestoneId: 'ms-1-2', projectId: 'proj-1', title: '测试多人同步功能', priority: 'urgent', estimatedHours: 20, assignee: '赵静', taskType: 'qa', status: 'in_progress', assetIds: [] },
    { id: 't-6', milestoneId: 'ms-2-2', projectId: 'proj-2', title: '实现连招战斗系统', priority: 'urgent', estimatedHours: 60, assignee: '陈浩', taskType: 'programming', status: 'in_progress', assetIds: ['a-3'] },
    { id: 't-7', milestoneId: 'ms-2-2', projectId: 'proj-2', title: '设计暗黑风角色立绘', priority: 'high', estimatedHours: 36, assignee: '刘洋', taskType: 'art', status: 'in_progress', assetIds: ['a-4'] },
    { id: 't-8', milestoneId: 'ms-2-2', projectId: 'proj-2', title: '编写技能平衡配置表', priority: 'medium', estimatedHours: 12, assignee: '孙鹏', taskType: 'design', status: 'testing', assetIds: [] },
    { id: 't-9', milestoneId: 'ms-2-2', projectId: 'proj-2', title: '战斗音效集成', priority: 'low', estimatedHours: 8, assignee: null, taskType: 'audio', status: 'unassigned', assetIds: ['a-5'] },
    { id: 't-10', milestoneId: 'ms-3-3', projectId: 'proj-3', title: '修复作物生长动画bug', priority: 'high', estimatedHours: 8, assignee: '周婷', taskType: 'programming', status: 'in_progress', assetIds: [] },
    { id: 't-11', milestoneId: 'ms-3-3', projectId: 'proj-3', title: '优化移动端触控手感', priority: 'medium', estimatedHours: 16, assignee: '吴昊', taskType: 'programming', status: 'testing', assetIds: [] },
    { id: 't-12', milestoneId: 'ms-3-3', projectId: 'proj-3', title: '最终QA全量回归', priority: 'urgent', estimatedHours: 24, assignee: '郑蕾', taskType: 'qa', status: 'in_progress', assetIds: [] },
    { id: 't-13', milestoneId: 'ms-4-1', projectId: 'proj-4', title: '设计机甲零件系统架构', priority: 'high', estimatedHours: 32, assignee: '黄峰', taskType: 'design', status: 'in_progress', assetIds: ['a-6'] },
    { id: 't-14', milestoneId: 'ms-4-1', projectId: 'proj-4', title: '3D机甲基础模型制作', priority: 'high', estimatedHours: 48, assignee: '林雪', taskType: 'art', status: 'in_progress', assetIds: ['a-7'] },
    { id: 't-15', milestoneId: 'ms-4-1', projectId: 'proj-4', title: '实现物理引擎碰撞检测', priority: 'medium', estimatedHours: 28, assignee: '张伟', taskType: 'programming', status: 'unassigned', assetIds: [] },
    { id: 't-16', milestoneId: 'ms-1-3', projectId: 'proj-1', title: '设计结局分支剧情', priority: 'medium', estimatedHours: 20, assignee: null, taskType: 'design', status: 'unassigned', assetIds: [] },
    { id: 't-17', milestoneId: 'ms-2-3', projectId: 'proj-2', title: '修复排行榜数据同步', priority: 'high', estimatedHours: 12, assignee: '陈浩', taskType: 'programming', status: 'testing', assetIds: [] },
  ],
  assets: [
    { id: 'a-1', projectId: 'proj-1', name: 'star_map_bg.png', type: 'image', status: 'in_production' },
    { id: 'a-2', projectId: 'proj-1', name: 'fleet_command_ui.fig', type: 'image', status: 'in_production' },
    { id: 'a-3', projectId: 'proj-2', name: 'combo_system_blueprint.doc', type: 'other', status: 'in_production' },
    { id: 'a-4', projectId: 'proj-2', name: 'dark_knight_model.fbx', type: '3d_model', status: 'in_production' },
    { id: 'a-5', projectId: 'proj-2', name: 'combat_sfx_pack.wav', type: 'audio', status: 'in_production' },
    { id: 'a-6', projectId: 'proj-4', name: 'mecha_parts_architecture.xlsx', type: 'other', status: 'completed' },
    { id: 'a-7', projectId: 'proj-4', name: 'base_mecha_model.fbx', type: '3d_model', status: 'in_production' },
  ],
};

function loadData(): AppData {
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return JSON.parse(JSON.stringify(defaultData));
  }
  const raw = readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data: AppData): void {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(message: WsMessage) {
  const raw = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  });
}

app.get('/api/projects', (_req, res) => {
  const data = loadData();
  res.json(data.projects);
});

app.get('/api/projects/:id', (req, res) => {
  const data = loadData();
  const project = data.projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const data = loadData();
  const project: Project = {
    id: uuidv4(),
    name: req.body.name || 'Untitled Project',
    engine: req.body.engine || 'Unity',
    customEngine: req.body.customEngine,
    platforms: req.body.platforms || ['PC'],
    releaseDate: req.body.releaseDate || new Date().toISOString().split('T')[0],
    description: req.body.description || '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  data.projects.push(project);
  saveData(data);
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const data = loadData();
  const idx = data.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  data.projects[idx] = { ...data.projects[idx], ...req.body, id: req.params.id };
  saveData(data);
  res.json(data.projects[idx]);
});

app.delete('/api/projects/:id', (req, res) => {
  const data = loadData();
  const idx = data.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  data.projects.splice(idx, 1);
  data.milestones = data.milestones.filter((m) => m.projectId !== req.params.id);
  data.tasks = data.tasks.filter((t) => t.projectId !== req.params.id);
  data.assets = data.assets.filter((a) => a.projectId !== req.params.id);
  saveData(data);
  res.json({ success: true });
});

app.get('/api/projects/:projectId/milestones', (req, res) => {
  const data = loadData();
  const milestones = data.milestones.filter((m) => m.projectId === req.params.projectId);
  res.json(milestones);
});

app.post('/api/projects/:projectId/milestones', (req, res) => {
  const data = loadData();
  const milestone: Milestone = {
    id: uuidv4(),
    projectId: req.params.projectId,
    name: req.body.name || 'New Milestone',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || new Date().toISOString().split('T')[0],
    status: req.body.status || 'planning',
  };
  data.milestones.push(milestone);
  saveData(data);
  res.status(201).json(milestone);
});

app.put('/api/milestones/:id', (req, res) => {
  const data = loadData();
  const idx = data.milestones.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  const old = data.milestones[idx];
  data.milestones[idx] = { ...old, ...req.body, id: req.params.id, projectId: old.projectId };

  if (req.body.startDate || req.body.endDate) {
    const updated = data.milestones[idx];
    const siblingMilestones = data.milestones.filter(
      (m) => m.projectId === updated.projectId && m.id !== updated.id
    );
    const hasOverlap = siblingMilestones.some((m) => {
      return updated.startDate < m.endDate && updated.endDate > m.startDate;
    });
    if (hasOverlap) {
      data.milestones[idx] = old;
      saveData(data);
      res.status(400).json({ error: 'Milestone dates overlap with existing milestones' });
      return;
    }
    if (updated.startDate >= updated.endDate) {
      data.milestones[idx] = old;
      saveData(data);
      res.status(400).json({ error: 'Start date must be before end date' });
      return;
    }
  }

  saveData(data);
  broadcast({ type: 'milestone:updated', payload: data.milestones[idx], projectId: old.projectId });
  res.json(data.milestones[idx]);
});

app.delete('/api/milestones/:id', (req, res) => {
  const data = loadData();
  const idx = data.milestones.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  const projectId = data.milestones[idx].projectId;
  data.milestones.splice(idx, 1);
  data.tasks = data.tasks.filter((t) => t.milestoneId !== req.params.id);
  saveData(data);
  broadcast({ type: 'milestone:updated', payload: { deleted: req.params.id }, projectId });
  res.json({ success: true });
});

app.get('/api/projects/:projectId/tasks', (req, res) => {
  const data = loadData();
  const tasks = data.tasks.filter((t) => t.projectId === req.params.projectId);
  res.json(tasks);
});

app.get('/api/milestones/:milestoneId/tasks', (req, res) => {
  const data = loadData();
  const tasks = data.tasks.filter((t) => t.milestoneId === req.params.milestoneId);
  res.json(tasks);
});

app.post('/api/milestones/:milestoneId/tasks', (req, res) => {
  const data = loadData();
  const milestone = data.milestones.find((m) => m.id === req.params.milestoneId);
  if (!milestone) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  const task: Task = {
    id: uuidv4(),
    milestoneId: req.params.milestoneId,
    projectId: milestone.projectId,
    title: req.body.title || 'New Task',
    priority: req.body.priority || 'medium',
    estimatedHours: req.body.estimatedHours || 0,
    assignee: req.body.assignee || null,
    taskType: req.body.taskType || 'programming',
    status: req.body.status || 'unassigned',
    assetIds: req.body.assetIds || [],
  };
  data.tasks.push(task);
  saveData(data);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const data = loadData();
  const idx = data.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const old = data.tasks[idx];
  const statusChanged = req.body.status && req.body.status !== old.status;
  data.tasks[idx] = { ...old, ...req.body, id: req.params.id, milestoneId: old.milestoneId, projectId: old.projectId };
  saveData(data);

  if (statusChanged) {
    broadcast({
      type: 'task:status_changed',
      payload: { task: data.tasks[idx], oldStatus: old.status },
      projectId: old.projectId,
    });
  }

  res.json(data.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = loadData();
  const idx = data.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  data.tasks.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

app.get('/api/projects/:projectId/assets', (req, res) => {
  const data = loadData();
  const assets = data.assets.filter((a) => a.projectId === req.params.projectId);
  res.json(assets);
});

app.post('/api/projects/:projectId/assets', (req, res) => {
  const data = loadData();
  const asset: Asset = {
    id: uuidv4(),
    projectId: req.params.projectId,
    name: req.body.name || 'Unnamed Asset',
    type: req.body.type || 'other',
    status: req.body.status || 'in_production',
  };
  data.assets.push(asset);
  saveData(data);
  res.status(201).json(asset);
});

app.put('/api/assets/:id', (req, res) => {
  const data = loadData();
  const idx = data.assets.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  const old = data.assets[idx];
  const statusChanged = req.body.status && req.body.status !== old.status;
  data.assets[idx] = { ...old, ...req.body, id: req.params.id, projectId: old.projectId };
  saveData(data);

  if (statusChanged) {
    const affectedTaskIds = data.tasks
      .filter((t) => t.assetIds.includes(req.params.id))
      .map((t) => t.id);
    broadcast({
      type: 'asset:status_changed',
      payload: { asset: data.assets[idx], oldStatus: old.status, affectedTaskIds },
      projectId: old.projectId,
    });
  }

  res.json(data.assets[idx]);
});

app.delete('/api/assets/:id', (req, res) => {
  const data = loadData();
  const idx = data.assets.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  const projectId = data.assets[idx].projectId;
  data.assets.splice(idx, 1);
  data.tasks.forEach((t) => {
    t.assetIds = t.assetIds.filter((aid) => aid !== req.params.id);
  });
  saveData(data);
  broadcast({ type: 'asset:status_changed', payload: { deleted: req.params.id }, projectId });
  res.json({ success: true });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
