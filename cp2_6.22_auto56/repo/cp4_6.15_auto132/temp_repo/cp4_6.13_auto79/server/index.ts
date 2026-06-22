import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  userQueries,
  projectQueries,
  shotQueries,
  type User,
  type Project,
  type Shot,
} from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'shotboard-studio-secret-key-2024';
const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

initDatabase();

interface AuthRequest extends express.Request {
  userId?: string;
}

function authMiddleware(
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token无效或已过期' });
  }
}

function updateProjectLastEdited(projectId: string): void {
  projectQueries.updateLastEdited.run(new Date().toISOString(), projectId);
}

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: '邮箱和密码不能为空' });
    return;
  }

  const existing = userQueries.findByEmail.get(email) as User | undefined;
  if (existing) {
    res.status(400).json({ error: '该邮箱已被注册' });
    return;
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();

  userQueries.create.run(id, email, passwordHash, createdAt);

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id, email, createdAt },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: '邮箱和密码不能为空' });
    return;
  }

  const user = userQueries.findByEmail.get(email) as User | undefined;
  if (!user) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  });
});

app.get('/api/projects', authMiddleware, (req: AuthRequest, res) => {
  const projects = projectQueries.findByUserId.all(req.userId!) as Project[];
  res.json(projects);
});

app.post('/api/projects', authMiddleware, (req: AuthRequest, res) => {
  const { name } = req.body as { name: string };

  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: '项目名称不能为空' });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  projectQueries.create.run(id, name.trim(), req.userId!, now, now);

  const project = projectQueries.findById.get(id, req.userId!) as Project;
  res.status(201).json(project);
});

app.get('/api/projects/:projectId/shots', authMiddleware, (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = projectQueries.findById.get(projectId, req.userId!) as Project | undefined;
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const shots = shotQueries.findByProjectId.all(projectId) as Shot[];
  res.json(shots);
});

app.post('/api/projects/:projectId/shots', authMiddleware, (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { duration = 1.0, description = '', imageUrl = null } = req.body as Partial<Shot>;

  const project = projectQueries.findById.get(projectId, req.userId!) as Project | undefined;
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const result = shotQueries.getMaxIndex.get(projectId) as { maxIndex: number };
  const nextIndex = result.maxIndex + 1;

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  shotQueries.create.run(
    id,
    projectId,
    nextIndex,
    Math.max(0.5, duration),
    description,
    imageUrl,
    createdAt
  );

  updateProjectLastEdited(projectId);

  const shot = shotQueries.findById.get(id) as Shot;
  res.status(201).json(shot);
});

app.put('/api/shots/:shotId', authMiddleware, (req: AuthRequest, res) => {
  const { shotId } = req.params;
  const { duration, description, imageUrl } = req.body as Partial<Shot>;

  const shot = shotQueries.findByIdAndProject.get(shotId, req.userId!) as Shot | undefined;
  if (!shot) {
    res.status(404).json({ error: '镜头不存在' });
    return;
  }

  const newDuration = duration !== undefined ? Math.max(0.5, duration) : shot.duration;
  const newDescription = description !== undefined ? description : shot.description;
  const newImageUrl = imageUrl !== undefined ? imageUrl : shot.imageUrl;

  shotQueries.update.run(newDuration, newDescription, newImageUrl, shotId);
  updateProjectLastEdited(shot.projectId);

  const updated = shotQueries.findById.get(shotId) as Shot;
  res.json(updated);
});

app.delete('/api/shots/:shotId', authMiddleware, (req: AuthRequest, res) => {
  const { shotId } = req.params;

  const shot = shotQueries.findByIdAndProject.get(shotId, req.userId!) as Shot | undefined;
  if (!shot) {
    res.status(404).json({ error: '镜头不存在' });
    return;
  }

  const projectId = shot.projectId;
  const deletedIndex = shot.shotIndex;

  shotQueries.delete.run(shotId);

  const remainingShots = shotQueries.findByProjectId.all(projectId) as Shot[];
  remainingShots.forEach((s, idx) => {
    if (s.shotIndex !== idx) {
      shotQueries.updateIndex.run(idx, s.id);
    }
  });

  updateProjectLastEdited(projectId);
  res.json({ success: true, deletedIndex });
});

app.put('/api/projects/:projectId/shots/reorder', authMiddleware, (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { shotId, newIndex } = req.body as { shotId: string; newIndex: number };

  const project = projectQueries.findById.get(projectId, req.userId!) as Project | undefined;
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const shot = shotQueries.findById.get(shotId) as Shot | undefined;
  if (!shot || shot.projectId !== projectId) {
    res.status(404).json({ error: '镜头不存在' });
    return;
  }

  const shots = shotQueries.findByProjectId.all(projectId) as Shot[];
  const oldIndex = shot.shotIndex;

  if (newIndex < 0 || newIndex >= shots.length) {
    res.status(400).json({ error: '索引越界' });
    return;
  }

  if (oldIndex === newIndex) {
    res.json({ success: true, shots });
    return;
  }

  const moveShot = shots.splice(oldIndex, 1)[0];
  shots.splice(newIndex, 0, moveShot);

  shots.forEach((s, idx) => {
    if (s.shotIndex !== idx) {
      shotQueries.updateIndex.run(idx, s.id);
    }
  });

  updateProjectLastEdited(projectId);

  const updatedShots = shotQueries.findByProjectId.all(projectId) as Shot[];
  res.json({ success: true, shots: updatedShots });
});

app.delete('/api/shots/batch', authMiddleware, (req: AuthRequest, res) => {
  const { shotIds } = req.body as { shotIds: string[] };

  if (!Array.isArray(shotIds) || shotIds.length === 0) {
    res.status(400).json({ error: '请选择要删除的镜头' });
    return;
  }

  const firstShot = shotQueries.findById.get(shotIds[0]) as Shot | undefined;
  if (!firstShot) {
    res.status(404).json({ error: '镜头不存在' });
    return;
  }

  const projectId = firstShot.projectId;
  const project = projectQueries.findById.get(projectId, req.userId!) as Project | undefined;
  if (!project) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  const deletedCount = shotIds.filter((id) => {
    const s = shotQueries.findById.get(id) as Shot | undefined;
    if (s && s.projectId === projectId) {
      shotQueries.delete.run(id);
      return true;
    }
    return false;
  }).length;

  const remaining = shotQueries.findByProjectId.all(projectId) as Shot[];
  remaining.forEach((s, idx) => {
    if (s.shotIndex !== idx) {
      shotQueries.updateIndex.run(idx, s.id);
    }
  });

  updateProjectLastEdited(projectId);
  res.json({ success: true, deletedCount });
});

app.put('/api/shots/batch/duration', authMiddleware, (req: AuthRequest, res) => {
  const { shotIds, duration } = req.body as { shotIds: string[]; duration: number };

  if (!Array.isArray(shotIds) || shotIds.length === 0) {
    res.status(400).json({ error: '请选择要操作的镜头' });
    return;
  }

  if (duration === undefined || duration < 0.5) {
    res.status(400).json({ error: '时长不能小于0.5秒' });
    return;
  }

  const firstShot = shotQueries.findById.get(shotIds[0]) as Shot | undefined;
  if (!firstShot) {
    res.status(404).json({ error: '镜头不存在' });
    return;
  }

  const projectId = firstShot.projectId;
  const project = projectQueries.findById.get(projectId, req.userId!) as Project | undefined;
  if (!project) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  let updatedCount = 0;
  shotIds.forEach((id) => {
    const s = shotQueries.findById.get(id) as Shot | undefined;
    if (s && s.projectId === projectId) {
      shotQueries.update.run(duration, s.description, s.imageUrl, id);
      updatedCount++;
    }
  });

  updateProjectLastEdited(projectId);
  res.json({ success: true, updatedCount });
});

app.post('/api/upload', authMiddleware, (req: AuthRequest, res) => {
  const { image, filename } = req.body as { image: string; filename: string };

  if (!image || !filename) {
    res.status(400).json({ error: '图片数据不能为空' });
    return;
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const ext = filename.split('.').pop() || 'png';
    const uniqueName = `${uuidv4()}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, base64Data, 'base64');

    const imageUrl = `/uploads/${uniqueName}`;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: '图片上传失败' });
  }
});

app.listen(PORT, () => {
  console.log(`ShotBoard Studio API server running on port ${PORT}`);
});
