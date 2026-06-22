import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { Request, Response, NextFunction } from 'express';
import {
  createUser,
  findUserByUsername,
  findUserById,
  getAllUsers,
  getProjectsByUserId,
  findProjectById,
  createProject,
  addProjectMember,
  getTaskUpdatesByProjectId,
  createTaskUpdate,
  sanitizeUser,
} from './data';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateRequest,
  type AuthRequest,
} from './auth';
import type { TaskStatus, WeeklyReport } from './types';

void jwt;
void bcrypt;
void uuidv4;

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const existingUser = findUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = createUser(username, passwordHash);
    const token = generateToken(user);

    res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const user = findUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(user);

    res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/api/users', authenticateRequest, (_req: AuthRequest, res: Response) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

app.get('/api/projects', authenticateRequest, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }
    const projects = getProjectsByUserId(req.user.id);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

app.post('/api/projects', authenticateRequest, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: '项目名称不能为空' });
      return;
    }

    const project = createProject(name, description || '', req.user.id);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: '创建项目失败' });
  }
});

app.post('/api/projects/:id/members', authenticateRequest, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: '用户名不能为空' });
      return;
    }

    const project = findProjectById(id);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    if (!project.memberIds.includes(req.user.id)) {
      res.status(403).json({ error: '您不是该项目成员' });
      return;
    }

    const memberToAdd = findUserByUsername(username);
    if (!memberToAdd) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const updatedProject = addProjectMember(id, memberToAdd.id);
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: '添加成员失败' });
  }
});

app.get('/api/projects/:id/updates', authenticateRequest, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { id } = req.params;

    const project = findProjectById(id);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    if (!project.memberIds.includes(req.user.id)) {
      res.status(403).json({ error: '您不是该项目成员' });
      return;
    }

    const updates = getTaskUpdatesByProjectId(id);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: '获取任务更新失败' });
  }
});

app.post('/api/projects/:id/updates', authenticateRequest, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { id } = req.params;
    const { targetUserId, status, note, tags } = req.body;

    if (!targetUserId || !status) {
      res.status(400).json({ error: '目标用户和状态不能为空' });
      return;
    }

    if (note && note.length > 200) {
      res.status(400).json({ error: '备注不能超过200字' });
      return;
    }

    const validStatuses: TaskStatus[] = ['planned', 'in-progress', 'blocked', 'completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: '无效的任务状态' });
      return;
    }

    const project = findProjectById(id);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    if (!project.memberIds.includes(req.user.id)) {
      res.status(403).json({ error: '您不是该项目成员' });
      return;
    }

    if (!project.memberIds.includes(targetUserId)) {
      res.status(400).json({ error: '目标用户不是该项目成员' });
      return;
    }

    const taskUpdate = createTaskUpdate(
      id,
      req.user.id,
      targetUserId,
      status,
      note || '',
      tags || []
    );

    res.status(201).json(taskUpdate);
  } catch (error) {
    res.status(500).json({ error: '创建任务更新失败' });
  }
});

app.get('/api/projects/:id/weekly-report', authenticateRequest, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { id } = req.params;

    const project = findProjectById(id);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    if (!project.memberIds.includes(req.user.id)) {
      res.status(403).json({ error: '您不是该项目成员' });
      return;
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const updates = getTaskUpdatesByProjectId(id);
    const weeklyUpdates = updates.filter(update => {
      const updateDate = new Date(update.createdAt);
      return isWithinInterval(updateDate, { start: weekStart, end: weekEnd });
    });

    const reportMap = new Map<string, WeeklyReport>();

    project.memberIds.forEach(memberId => {
      const user = findUserById(memberId);
      if (user) {
        reportMap.set(memberId, {
          userId: memberId,
          username: user.username,
          completed: 0,
          blocked: 0,
          inProgress: 0,
          notes: [],
        });
      }
    });

    weeklyUpdates.forEach(update => {
      const report = reportMap.get(update.targetUserId);
      if (report) {
        switch (update.status) {
          case 'completed':
            report.completed++;
            break;
          case 'blocked':
            report.blocked++;
            break;
          case 'in-progress':
            report.inProgress++;
            break;
        }
        if (update.note) {
          report.notes.push(update.note);
        }
      }
    });

    const report: WeeklyReport[] = Array.from(reportMap.values());
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: '生成周报失败' });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
