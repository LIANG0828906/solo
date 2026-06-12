import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getSkillsByUserId,
  getAllSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getSkillById,
  getExchangesByUserId,
  createExchange,
  updateExchangeStatus,
  getExchangeById,
  createTransaction,
  getUserById,
  updateUserPoints,
  getTransactionsByUserId,
} from './database';
import { authenticateToken } from './userRoutes';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

router.get('/my', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const skills = getSkillsByUserId(userId);
  res.json(skills);
});

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const skills = getAllSkills();
  const userId = req.userId;
  
  const result = skills.filter(skill => skill.user_id !== userId).map(skill => {
    const user = getUserById(skill.user_id);
    return {
      ...skill,
      provider: user ? {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      } : null,
    };
  });

  res.json(result);
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const { skill_name, skill_type, description, requirement, time_slots } = req.body;

  if (!skill_name || !skill_type || !time_slots) {
    res.status(400).json({ error: '技能名称、类型和时间段不能为空' });
    return;
  }

  const skill = createSkill({
    id: uuidv4(),
    user_id: userId,
    skill_name,
    skill_type,
    description: description || '',
    requirement: requirement || '',
    time_slots: typeof time_slots === 'string' ? time_slots : JSON.stringify(time_slots),
    status: 'active',
    created_at: new Date().toISOString(),
  });

  res.status(201).json(skill);
});

router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const skill = getSkillById(req.params.id);
  if (!skill) {
    res.status(404).json({ error: '技能不存在' });
    return;
  }

  if (skill.user_id !== userId) {
    res.status(403).json({ error: '无权限修改' });
    return;
  }

  const updates: any = {};
  const fields = ['skill_name', 'skill_type', 'description', 'requirement', 'time_slots', 'status'];
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'time_slots' && typeof req.body[field] !== 'string'
        ? JSON.stringify(req.body[field])
        : req.body[field];
    }
  });

  const updatedSkill = updateSkill(req.params.id, updates);
  res.json(updatedSkill);
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const skill = getSkillById(req.params.id);
  if (!skill) {
    res.status(404).json({ error: '技能不存在' });
    return;
  }

  if (skill.user_id !== userId) {
    res.status(403).json({ error: '无权限删除' });
    return;
  }

  updateSkill(req.params.id, { status: 'inactive' });
  res.json({ message: '技能已下架' });
});

router.get('/exchanges', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const exchanges = getExchangesByUserId(userId);
  
  const result = exchanges.map(exchange => {
    const otherUserId = exchange.requester_id === userId ? exchange.provider_id : exchange.requester_id;
    const otherUser = getUserById(otherUserId);
    const skill = getSkillById(exchange.skill_id);
    
    return {
      ...exchange,
      otherUser: otherUser ? {
        id: otherUser.id,
        username: otherUser.username,
        avatar: otherUser.avatar,
      } : null,
      skill: skill || null,
      isRequester: exchange.requester_id === userId,
    };
  });

  res.json(result);
});

router.post('/exchanges', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const { skill_id, exchange_time } = req.body;

  if (!skill_id || !exchange_time) {
    res.status(400).json({ error: '技能ID和交换时间不能为空' });
    return;
  }

  const skill = getSkillById(skill_id);
  if (!skill || skill.status !== 'active') {
    res.status(404).json({ error: '技能不存在或已下架' });
    return;
  }

  if (skill.user_id === userId) {
    res.status(400).json({ error: '不能预约自己的技能' });
    return;
  }

  const exchange = createExchange({
    id: uuidv4(),
    skill_id,
    requester_id: userId,
    provider_id: skill.user_id,
    exchange_time,
    status: 'pending',
    points: 10,
    created_at: new Date().toISOString(),
  });

  res.status(201).json(exchange);
});

router.put('/exchanges/:id/status', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const { status } = req.body;
  const exchange = getExchangeById(req.params.id);
  
  if (!exchange) {
    res.status(404).json({ error: '交换不存在' });
    return;
  }

  if (exchange.provider_id !== userId && exchange.requester_id !== userId) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  const updatedExchange = updateExchangeStatus(req.params.id, status);

  if (status === 'completed') {
    const provider = getUserById(exchange.provider_id);
    const requester = getUserById(exchange.requester_id);
    
    if (provider && requester) {
      updateUserPoints(exchange.provider_id, provider.points + exchange.points);
      updateUserPoints(exchange.requester_id, Math.max(0, requester.points - exchange.points));

      createTransaction({
        id: uuidv4(),
        user_id: exchange.provider_id,
        exchange_id: exchange.id,
        amount: exchange.points,
        type: 'earn',
        description: `完成技能交换获得${exchange.points}积分`,
        created_at: new Date().toISOString(),
      });

      createTransaction({
        id: uuidv4(),
        user_id: exchange.requester_id,
        exchange_id: exchange.id,
        amount: exchange.points,
        type: 'spend',
        description: `完成技能交换消耗${exchange.points}积分`,
        created_at: new Date().toISOString(),
      });
    }
  }

  res.json(updatedExchange);
});

router.get('/transactions', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const transactions = getTransactionsByUserId(userId);
  res.json(transactions);
});

export default router;
