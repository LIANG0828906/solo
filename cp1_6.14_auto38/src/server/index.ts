import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Member {
  id: string;
  name: string;
  avatar: string;
  points: number;
  isAdmin: boolean;
  passwordHash?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

type TaskCycle = 'daily' | 'weekly';
type TaskStatus = 'pending' | 'completed' | 'expired';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  cycle: TaskCycle;
  deadline: string;
  assigneeId: string | null;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  stock: number;
}

interface Redemption {
  id: string;
  memberId: string;
  rewardId: string;
  points: number;
  createdAt: string;
}

interface Data {
  members: Member[];
  categories: Category[];
  tasks: Task[];
  rewards: Reward[];
  redemptions: Redemption[];
}

const defaultData: Data = {
  members: [
    { id: 'member-1', name: '爸爸', avatar: '👨', points: 120, isAdmin: true },
    { id: 'member-2', name: '妈妈', avatar: '👩', points: 150, isAdmin: true },
    { id: 'member-3', name: '女儿', avatar: '👧', points: 80, isAdmin: false },
    { id: 'member-4', name: '儿子', avatar: '👦', points: 65, isAdmin: false },
    { id: 'member-5', name: '奶奶', avatar: '🧓', points: 200, isAdmin: false },
    { id: 'member-6', name: '爷爷', avatar: '👴', points: 180, isAdmin: false },
    { id: 'member-7', name: '猫咪', avatar: '🐱', points: 30, isAdmin: false },
    { id: 'member-8', name: '狗狗', avatar: '🐶', points: 45, isAdmin: false },
  ],
  categories: [
    { id: 'category-1', name: '清洁', color: '#3B82F6' },
    { id: 'category-2', name: '烹饪', color: '#F59E0B' },
    { id: 'category-3', name: '洗衣', color: '#10B981' },
    { id: 'category-4', name: '购物', color: '#8B5CF6' },
  ],
  tasks: [
    {
      id: 'task-1',
      title: '打扫客厅',
      description: '拖地、整理沙发、擦拭桌面',
      category: 'category-1',
      points: 5,
      cycle: 'daily',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      assigneeId: 'member-3',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: '做晚饭',
      description: '准备三菜一汤，营养均衡',
      category: 'category-2',
      points: 8,
      cycle: 'daily',
      deadline: new Date(Date.now() + 43200000).toISOString(),
      assigneeId: 'member-2',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: '洗衣服',
      description: '把脏衣服洗好并晾干，分类折叠',
      category: 'category-3',
      points: 6,
      cycle: 'weekly',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      assigneeId: 'member-4',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: '买 groceries',
      description: '购买一周的生活用品和食材',
      category: 'category-4',
      points: 10,
      cycle: 'weekly',
      deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
      assigneeId: 'member-1',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: '洗碗',
      description: '餐后洗碗并整理厨房台面',
      category: 'category-2',
      points: 3,
      cycle: 'daily',
      deadline: new Date(Date.now() + 64800000).toISOString(),
      assigneeId: null,
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      title: '倒垃圾',
      description: '把家里的垃圾都带下楼扔掉',
      category: 'category-1',
      points: 2,
      cycle: 'daily',
      deadline: new Date(Date.now() + 72000000).toISOString(),
      assigneeId: 'member-4',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-7',
      title: '整理房间',
      description: '整理自己的房间，保持干净整洁',
      category: 'category-1',
      points: 4,
      cycle: 'daily',
      deadline: new Date(Date.now() + 54000000).toISOString(),
      assigneeId: 'member-3',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-8',
      title: '浇花',
      description: '给阳台上的花草浇水',
      category: 'category-1',
      points: 2,
      cycle: 'daily',
      deadline: new Date(Date.now() + 36000000).toISOString(),
      assigneeId: 'member-7',
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
  rewards: [
    { id: 'reward-1', name: '看电影', description: '周末全家一起看电影', points: 50, stock: 2 },
    { id: 'reward-2', name: '吃冰淇淋', description: '一支美味的冰淇淋', points: 20, stock: 10 },
    { id: 'reward-3', name: '新玩具', description: '一个惊喜小礼物', points: 100, stock: 3 },
    { id: 'reward-4', name: '免做家务', description: '可以免去一次家务任务', points: 80, stock: 5 },
    { id: 'reward-5', name: '选餐厅', description: '周末出去吃饭你来选', points: 60, stock: 1 },
    { id: 'reward-6', name: '晚点睡', description: '周末可以晚睡一小时', points: 30, stock: 4 },
  ],
  redemptions: [],
};

const dbPath = path.join(__dirname, '..', '..', 'db.json');
const adapter = new JSONFile<Data>(dbPath);
const db = new Low(adapter, defaultData);

await db.read();
if (!db.data || !db.data.members || db.data.members.length === 0) {
  db.data = defaultData;
  await db.write();
}

let dbLock = false;

async function withLock<T>(operation: () => Promise<T>): Promise<T> {
  let attempts = 0;
  while (dbLock && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    attempts++;
  }
  if (dbLock) {
    throw new Error('Database timeout');
  }
  dbLock = true;
  try {
    await db.read();
    const result = await operation();
    await db.write();
    return result;
  } finally {
    dbLock = false;
  }
}

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: 'family-chores-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Family Chores API is running' });
});

app.get('/api/members', async (req, res) => {
  await db.read();
  const members = db.data.members.map(({ passwordHash, ...member }) => member);
  res.json(members);
});

app.get('/api/members/:id', async (req, res) => {
  await db.read();
  const member = db.data.members.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  const { passwordHash, ...memberWithoutPassword } = member;
  res.json(memberWithoutPassword);
});

app.post('/api/members', async (req, res) => {
  const { name, avatar, points = 0, isAdmin = false, password } = req.body;
  if (!name || !avatar) {
    return res.status(400).json({ error: 'Name and avatar are required' });
  }

  try {
    const newMember: Member = {
      id: uuidv4(),
      name,
      avatar,
      points,
      isAdmin,
    };

    if (password) {
      newMember.passwordHash = await bcrypt.hash(password, 10);
    }

    await withLock(async () => {
      db.data.members.push(newMember);
    });

    const { passwordHash, ...memberWithoutPassword } = newMember;
    res.status(201).json(memberWithoutPassword);
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const result = await withLock(async () => {
      const index = db.data.members.findIndex(m => m.id === req.params.id);
      if (index === -1) {
        throw new Error('Member not found');
      }
      const updateData: Partial<Member> = { ...req.body };
      delete updateData.id;
      delete updateData.passwordHash;

      if (req.body.password) {
        updateData.passwordHash = await bcrypt.hash(req.body.password, 10);
      }

      db.data.members[index] = { ...db.data.members[index], ...updateData, id: req.params.id };
      return db.data.members[index];
    });

    const { passwordHash, ...memberWithoutPassword } = result;
    res.json(memberWithoutPassword);
  } catch (error) {
    if (error instanceof Error && error.message === 'Member not found') {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(500).json({ error: 'Failed to update member' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await withLock(async () => {
      const index = db.data.members.findIndex(m => m.id === req.params.id);
      if (index === -1) {
        throw new Error('Member not found');
      }
      db.data.members.splice(index, 1);
      db.data.tasks.forEach(task => {
        if (task.assigneeId === req.params.id) {
          task.assigneeId = null;
        }
      });
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Member not found') {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

app.get('/api/tasks', async (req, res) => {
  await db.read();
  res.json(db.data.tasks);
});

app.get('/api/tasks/:id', async (req, res) => {
  await db.read();
  const task = db.data.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/api/tasks', async (req, res) => {
  const { title, description, category, points, cycle, deadline, assigneeId = null } = req.body;
  if (!title || !category || points === undefined || !cycle || !deadline) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newTask: Task = {
      id: uuidv4(),
      title,
      description: description || '',
      category,
      points: Math.min(10, Math.max(1, points)),
      cycle,
      deadline,
      assigneeId,
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    await withLock(async () => {
      db.data.tasks.push(newTask);
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await withLock(async () => {
      const index = db.data.tasks.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new Error('Task not found');
      }
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.createdAt;

      if (updateData.points !== undefined) {
        updateData.points = Math.min(10, Math.max(1, updateData.points));
      }

      db.data.tasks[index] = { ...db.data.tasks[index], ...updateData, id: req.params.id };
      return db.data.tasks[index];
    });
    res.json(updatedTask);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await withLock(async () => {
      const index = db.data.tasks.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new Error('Task not found');
      }
      db.data.tasks.splice(index, 1);
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/api/tasks/:id/complete', async (req, res) => {
  try {
    const result = await withLock(async () => {
      const taskIndex = db.data.tasks.findIndex(t => t.id === req.params.id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      const task = db.data.tasks[taskIndex];
      if (task.status === 'completed') {
        throw new Error('Task already completed');
      }
      if (task.status === 'expired') {
        throw new Error('Task already expired');
      }

      task.status = 'completed';
      task.completedAt = new Date().toISOString();

      let updatedMember = null;
      if (task.assigneeId) {
        const memberIndex = db.data.members.findIndex(m => m.id === task.assigneeId);
        if (memberIndex !== -1) {
          db.data.members[memberIndex].points += task.points;
          const { passwordHash, ...memberWithoutPassword } = db.data.members[memberIndex];
          updatedMember = memberWithoutPassword;
        }
      }

      return { task, member: updatedMember };
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

app.put('/api/tasks/:id/assign', async (req, res) => {
  const { memberId } = req.body;
  try {
    const task = await withLock(async () => {
      const taskIndex = db.data.tasks.findIndex(t => t.id === req.params.id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      if (memberId !== null && memberId !== undefined) {
        const memberExists = db.data.members.some(m => m.id === memberId);
        if (!memberExists) {
          throw new Error('Member not found');
        }
      }
      db.data.tasks[taskIndex].assigneeId = memberId ?? null;
      return db.data.tasks[taskIndex];
    });
    res.json(task);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

app.get('/api/rewards', async (req, res) => {
  await db.read();
  res.json(db.data.rewards);
});

app.get('/api/rewards/:id', async (req, res) => {
  await db.read();
  const reward = db.data.rewards.find(r => r.id === req.params.id);
  if (!reward) {
    return res.status(404).json({ error: 'Reward not found' });
  }
  res.json(reward);
});

app.post('/api/rewards', async (req, res) => {
  const { name, description, points, stock = 0 } = req.body;
  if (!name || points === undefined) {
    return res.status(400).json({ error: 'Name and points are required' });
  }

  try {
    const newReward: Reward = {
      id: uuidv4(),
      name,
      description: description || '',
      points,
      stock,
    };

    await withLock(async () => {
      db.data.rewards.push(newReward);
    });

    res.status(201).json(newReward);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

app.put('/api/rewards/:id', async (req, res) => {
  try {
    const updatedReward = await withLock(async () => {
      const index = db.data.rewards.findIndex(r => r.id === req.params.id);
      if (index === -1) {
        throw new Error('Reward not found');
      }
      const updateData = { ...req.body };
      delete updateData.id;
      db.data.rewards[index] = { ...db.data.rewards[index], ...updateData, id: req.params.id };
      return db.data.rewards[index];
    });
    res.json(updatedReward);
  } catch (error) {
    if (error instanceof Error && error.message === 'Reward not found') {
      return res.status(404).json({ error: 'Reward not found' });
    }
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

app.delete('/api/rewards/:id', async (req, res) => {
  try {
    await withLock(async () => {
      const index = db.data.rewards.findIndex(r => r.id === req.params.id);
      if (index === -1) {
        throw new Error('Reward not found');
      }
      db.data.rewards.splice(index, 1);
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Reward not found') {
      return res.status(404).json({ error: 'Reward not found' });
    }
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

app.post('/api/rewards/:id/redeem', async (req, res) => {
  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  try {
    const result = await withLock(async () => {
      const rewardIndex = db.data.rewards.findIndex(r => r.id === req.params.id);
      if (rewardIndex === -1) {
        throw new Error('Reward not found');
      }
      const memberIndex = db.data.members.findIndex(m => m.id === memberId);
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }

      const reward = db.data.rewards[rewardIndex];
      const member = db.data.members[memberIndex];

      if (reward.stock <= 0) {
        throw new Error('Reward is out of stock');
      }
      if (member.points < reward.points) {
        throw new Error('Not enough points');
      }

      member.points -= reward.points;
      reward.stock -= 1;

      const redemption: Redemption = {
        id: uuidv4(),
        memberId,
        rewardId: reward.id,
        points: reward.points,
        createdAt: new Date().toISOString(),
      };
      db.data.redemptions.push(redemption);

      const { passwordHash, ...memberWithoutPassword } = member;
      return { member: memberWithoutPassword, reward, message: 'Redemption successful' };
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Reward not found' || error.message === 'Member not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

app.get('/api/report/weekly', async (req, res) => {
  await db.read();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const memberStats = db.data.members.map(member => {
    const memberTasks = db.data.tasks.filter(t => t.assigneeId === member.id);
    const completedTasks = memberTasks.filter(
      t => t.status === 'completed' && t.completedAt &&
        new Date(t.completedAt) >= weekStart && new Date(t.completedAt) <= weekEnd
    );
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const assignedInWeek = memberTasks.filter(
      t => new Date(t.createdAt) >= weekStart && new Date(t.createdAt) <= weekEnd
    );
    const completionRate = assignedInWeek.length > 0
      ? completedTasks.length / assignedInWeek.length
      : 0;

    const categoryStats: Record<string, number> = {};
    completedTasks.forEach(task => {
      categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
    });

    return {
      memberId: member.id,
      memberName: member.name,
      memberAvatar: member.avatar,
      completedTasks: completedTasks.length,
      totalPoints,
      completionRate,
      categoryStats,
    };
  });

  res.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    members: memberStats,
  });
});

app.get('/api/categories', async (req, res) => {
  await db.read();
  res.json(db.data.categories);
});

function checkExpiredTasks() {
  db.read().then(() => {
    const now = new Date();
    let updated = false;
    db.data.tasks.forEach(task => {
      if (task.status === 'pending' && new Date(task.deadline) < now) {
        task.status = 'expired';
        updated = true;
      }
    });
    if (updated) {
      db.write();
      console.log(`[${new Date().toISOString()}] Checked expired tasks`);
    }
  });
}

function startWeeklyExpiryCheck() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(23, 59, 59, 999);

  const timeUntilSunday = nextSunday.getTime() - now.getTime();

  setTimeout(() => {
    checkExpiredTasks();
    setInterval(checkExpiredTasks, 7 * 24 * 60 * 60 * 1000);
  }, timeUntilSunday);

  console.log(`Next weekly expiry check scheduled at: ${nextSunday.toISOString()}`);
}

checkExpiredTasks();
startWeeklyExpiryCheck();

setInterval(checkExpiredTasks, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at /api/*`);
});
