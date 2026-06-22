import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel, OKRModel, User, Objective, KeyResult } from '../models/okr';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'okr-secret-key-2024';

interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = UserModel.findById(decoded.id);
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    const { password, ...safeUser } = user;
    req.user = { ...safeUser, password: '' } as User;
    next();
  } catch {
    res.status(403).json({ error: 'Token 无效' });
  }
};

export const requireManager = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'manager') {
    res.status(403).json({ error: '需要管理员权限' });
    return;
  }
  next();
};

router.post('/auth/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '请输入用户名和密码' });
    return;
  }

  const user = UserModel.findByUsername(username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _pw, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (req.user) {
    const { password, ...safeUser } = req.user;
    res.json({ user: safeUser });
  }
});

router.get('/users', authenticateToken, (_req: Request, res: Response): void => {
  const users = UserModel.getAll().map(({ password, ...u }) => u);
  res.json({ users });
});

router.get('/objectives', authenticateToken, (_req: Request, res: Response): void => {
  const objectives = OKRModel.getAll();
  res.json({ objectives });
});

router.get('/objectives/:id', authenticateToken, (req: Request, res: Response): void => {
  const objective = OKRModel.getById(req.params.id);
  if (!objective) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }
  res.json({ objective });
});

router.post('/objectives', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { title, description, quarter, keyResults } = req.body;

  if (!title || !quarter || !Array.isArray(keyResults)) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  if (keyResults.length < 3 || keyResults.length > 5) {
    res.status(400).json({ error: '关键结果数量必须在3-5个之间' });
    return;
  }

  try {
    const objective = OKRModel.create({
      title,
      description,
      quarter,
      ownerId: req.user!.id,
      keyResults: keyResults.map((kr: { title: string; description?: string; ownerId: string; deadline: string }) => ({
        title: kr.title,
        description: kr.description,
        ownerId: kr.ownerId,
        deadline: kr.deadline,
      })),
    });
    res.status(201).json({ objective });
  } catch (e) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.put('/objectives/:id', authenticateToken, (req: Request, res: Response): void => {
  const objective = OKRModel.update(req.params.id, req.body);
  if (!objective) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }
  res.json({ objective });
});

router.delete('/objectives/:id', authenticateToken, requireManager, (req: Request, res: Response): void => {
  const deleted = OKRModel.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }
  res.json({ success: true });
});

router.put('/objectives/:objId/keyresults/reorder', authenticateToken, (req: Request, res: Response): void => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'order 必须是数组' });
    return;
  }
  const keyResults = OKRModel.reorderKeyResults(req.params.objId, order);
  if (!keyResults) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }
  res.json({ keyResults });
});

router.post('/objectives/:objId/keyresults', authenticateToken, (req: Request, res: Response): void => {
  const { title, ownerId, deadline, description } = req.body;
  if (!title || !ownerId || !deadline) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const kr = OKRModel.addKeyResult(req.params.objId, { title, ownerId, deadline, description });
  if (!kr) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }
  res.status(201).json({ keyResult: kr });
});

router.put('/objectives/:objId/keyresults/:krId', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { progress, weeklyProgress, ...rest } = req.body;
  const obj = OKRModel.getById(req.params.objId);
  if (!obj) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }

  const kr = obj.keyResults.find((k) => k.id === req.params.krId);
  if (!kr) {
    res.status(404).json({ error: '关键结果不存在' });
    return;
  }

  if (progress !== undefined && req.user!.role !== 'manager' && kr.ownerId !== req.user!.id) {
    res.status(403).json({ error: '只能修改自己负责的关键结果进度' });
    return;
  }

  const updateData: Partial<KeyResult> = { ...rest };
  if (progress !== undefined) {
    updateData.progress = Math.max(0, Math.min(100, Number(progress)));
  }
  if (weeklyProgress !== undefined) {
    updateData.weeklyProgress = weeklyProgress;
  }

  const updated = OKRModel.updateKeyResult(req.params.objId, req.params.krId, updateData);
  res.json({ keyResult: updated });
});

router.put(
  '/objectives/:objId/keyresults/:krId/score',
  authenticateToken,
  requireManager,
  (req: Request, res: Response): void => {
    const { score, feedback } = req.body;
    if (score === undefined || score < 0 || score > 5) {
      res.status(400).json({ error: '评分必须在0-5之间' });
      return;
    }

    const updated = OKRModel.updateKeyResult(req.params.objId, req.params.krId, {
      score: Number(score),
      feedback,
    });
    if (!updated) {
      res.status(404).json({ error: '关键结果不存在' });
      return;
    }
    res.json({ keyResult: updated });
  }
);

router.delete(
  '/objectives/:objId/keyresults/:krId',
  authenticateToken,
  requireManager,
  (req: Request, res: Response): void => {
    const deleted = OKRModel.deleteKeyResult(req.params.objId, req.params.krId);
    if (!deleted) {
      res.status(404).json({ error: '关键结果不存在' });
      return;
    }
    res.json({ success: true });
  }
);

export default router;
