import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import {
  getAllFabrics,
  getFabricById,
  createFabric,
  updateFabric,
  deleteFabric,
  getProjectsByUser,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getUserByUsername,
  getUserById,
  Fabric,
  Project,
} from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  const user = getUserById(Number(userId));
  if (!user) {
    res.status(401).json({ error: '用户不存在' });
    return;
  }
  (req as any).user = user;
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: '需要管理员权限' });
    return;
  }
  next();
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = getUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  if (user.password !== password) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
  });
});

app.get('/api/fabrics', async (req, res) => {
  try {
    const fabrics = getAllFabrics();
    res.json(fabrics);
  } catch (err) {
    res.status(500).json({ error: '获取布料列表失败' });
  }
});

app.get('/api/fabrics/:id', async (req, res) => {
  try {
    const fabric = getFabricById(Number(req.params.id));
    if (!fabric) {
      res.status(404).json({ error: '布料不存在' });
      return;
    }
    res.json(fabric);
  } catch (err) {
    res.status(500).json({ error: '获取布料详情失败' });
  }
});

app.post('/api/fabrics', authenticate, requireAdmin, upload.none(), (req, res) => {
  try {
    const body = req.body;
    const data: Omit<Fabric, 'id' | 'createdAt'> = {
      name: body.name,
      color: body.color,
      colorCode: body.colorCode,
      pattern: body.pattern || '纯色',
      gradient: body.gradient,
      pricePerMeter: Number(body.pricePerMeter),
      stockMeters: Number(body.stockMeters),
      width: Number(body.width) || 1.5,
      description: body.description || '',
    };
    const fabric = createFabric(data);
    res.status(201).json(fabric);
  } catch (err) {
    res.status(500).json({ error: '创建布料失败' });
  }
});

app.put('/api/fabrics/:id', authenticate, requireAdmin, upload.none(), (req, res) => {
  try {
    const body = req.body;
    const id = Number(req.params.id);
    if (!getFabricById(id)) {
      res.status(404).json({ error: '布料不存在' });
      return;
    }
    const data: Partial<Omit<Fabric, 'id' | 'createdAt'>> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.color !== undefined) data.color = body.color;
    if (body.colorCode !== undefined) data.colorCode = body.colorCode;
    if (body.pattern !== undefined) data.pattern = body.pattern;
    if (body.gradient !== undefined) data.gradient = body.gradient;
    if (body.pricePerMeter !== undefined) data.pricePerMeter = Number(body.pricePerMeter);
    if (body.stockMeters !== undefined) data.stockMeters = Number(body.stockMeters);
    if (body.width !== undefined) data.width = Number(body.width);
    if (body.description !== undefined) data.description = body.description;
    const fabric = updateFabric(id, data);
    res.json(fabric);
  } catch (err) {
    res.status(500).json({ error: '更新布料失败' });
  }
});

app.delete('/api/fabrics/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!getFabricById(id)) {
      res.status(404).json({ error: '布料不存在' });
      return;
    }
    deleteFabric(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除布料失败' });
  }
});

app.get('/api/projects', authenticate, (req, res) => {
  try {
    const user = (req as any).user;
    const projects = user.role === 'admin' ? getAllProjects() : getProjectsByUser(user.id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

app.get('/api/projects/:id', authenticate, (req, res) => {
  try {
    const user = (req as any).user;
    const project = getProjectById(Number(req.params.id));
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }
    if (user.role !== 'admin' && project.userId !== user.id) {
      res.status(403).json({ error: '无权限访问此项目' });
      return;
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: '获取项目详情失败' });
  }
});

app.post('/api/projects', authenticate, (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;
    const data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      widthCm: Number(body.widthCm),
      heightCm: Number(body.heightCm),
      gridCols: Number(body.gridCols) || 20,
      gridRows: Number(body.gridRows) || 20,
      layout: JSON.stringify(body.layout || []),
      userId: user.id,
      totalCost: Number(body.totalCost) || 0,
      fabricUsage: JSON.stringify(body.fabricUsage || []),
    };
    const project = createProject(data);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: '创建项目失败' });
  }
});

app.put('/api/projects/:id', authenticate, (req, res) => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const project = getProjectById(id);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }
    if (user.role !== 'admin' && project.userId !== user.id) {
      res.status(403).json({ error: '无权限修改此项目' });
      return;
    }
    const body = req.body;
    const data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.widthCm !== undefined) data.widthCm = Number(body.widthCm);
    if (body.heightCm !== undefined) data.heightCm = Number(body.heightCm);
    if (body.gridCols !== undefined) data.gridCols = Number(body.gridCols);
    if (body.gridRows !== undefined) data.gridRows = Number(body.gridRows);
    if (body.layout !== undefined) data.layout = JSON.stringify(body.layout);
    if (body.totalCost !== undefined) data.totalCost = Number(body.totalCost);
    if (body.fabricUsage !== undefined) data.fabricUsage = JSON.stringify(body.fabricUsage);
    const updated = updateProject(id, data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新项目失败' });
  }
});

app.delete('/api/projects/:id', authenticate, (req, res) => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const project = getProjectById(id);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }
    if (user.role !== 'admin' && project.userId !== user.id) {
      res.status(403).json({ error: '无权限删除此项目' });
      return;
    }
    deleteProject(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除项目失败' });
  }
});

app.listen(PORT, () => {
  console.log(`拼布设计工作室 API 服务器运行在 http://localhost:${PORT}`);
});
