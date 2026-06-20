import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'city-treasure-hunt-secret-2024';
const DB_FILE = 'db.json';

interface Task {
  id: string;
  name: string;
  description: string;
  clue: string;
  lat: number;
  lng: number;
  points: number;
  difficulty: number;
  timeLimit: number;
}

interface UserTask {
  id: string;
  taskId: string;
  userId: string;
  acceptedAt: number;
  status: 'active' | 'completed' | 'failed';
}

interface User {
  id: string;
  username: string;
  password: string;
  points: number;
  level: number;
  achievements: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

interface DbSchema {
  tasks: Task[];
  userTasks: UserTask[];
  users: User[];
  achievements: Achievement[];
}

const defaultData: DbSchema = {
  tasks: [],
  userTasks: [],
  users: [],
  achievements: [
    { id: 'first-find', name: '首次发现', description: '完成第一个宝藏任务', icon: '🧭', condition: 'complete_1' },
    { id: 'sharpshooter', name: '百步穿杨', description: '在10米内找到宝藏', icon: '🎯', condition: 'precision_10' },
    { id: 'night-owl', name: '夜行侠', description: '在夜间完成任务', icon: '🦉', condition: 'night_complete' },
    { id: 'collector', name: '收藏家', description: '完成5个宝藏任务', icon: '💎', condition: 'complete_5' },
    { id: 'master', name: '寻宝大师', description: '完成10个宝藏任务', icon: '👑', condition: 'complete_10' },
  ],
};

function generateCityTasks(): Task[] {
  const baseLat = 31.2304;
  const baseLng = 121.4737;
  const tasks: Task[] = [
    { id: uuidv4(), name: '人民公园的秘密', description: '人民公园深处的隐藏宝藏', clue: '在人民公园正门左侧第三棵梧桐树下，寻得石碑之侧', lat: baseLat + 0.008, lng: baseLng - 0.005, points: 100, difficulty: 2, timeLimit: 86400000 },
    { id: uuidv4(), name: '外滩钟声', description: '外滩江边的古老秘密', clue: '听钟声响起，面朝江水，左转三步，低头寻觅', lat: baseLat + 0.002, lng: baseLng + 0.003, points: 150, difficulty: 3, timeLimit: 86400000 },
    { id: uuidv4(), name: '南京路迷宫', description: '繁华商业街中的隐秘角落', clue: '第三家老字号背后，红砖墙与青石板交汇处', lat: baseLat + 0.003, lng: baseLng + 0.001, points: 120, difficulty: 4, timeLimit: 86400000 },
    { id: uuidv4(), name: '城隍庙传说', description: '古庙中的千年传说', clue: '庙前石狮右爪之下，九步之内藏玄机', lat: baseLat + 0.001, lng: baseLng + 0.006, points: 200, difficulty: 5, timeLimit: 86400000 },
    { id: uuidv4(), name: '田子坊小巷', description: '艺术小巷中的创意宝藏', clue: '二楼阳台第三盆绿植旁，抬头望见彩虹', lat: baseLat - 0.003, lng: baseLng + 0.004, points: 80, difficulty: 1, timeLimit: 86400000 },
    { id: uuidv4(), name: '静安寺回响', description: '古刹梵音中的秘密', clue: '金顶之下，东侧香炉旁三步，足下即是', lat: baseLat + 0.006, lng: baseLng - 0.008, points: 160, difficulty: 3, timeLimit: 86400000 },
    { id: uuidv4(), name: '豫园假山', description: '江南园林的巧妙机关', clue: '九曲桥尽头，假山第三层，面南而立', lat: baseLat + 0.0015, lng: baseLng + 0.0055, points: 180, difficulty: 4, timeLimit: 86400000 },
    { id: uuidv4(), name: '陆家嘴天际', description: '摩天大楼脚下的秘密', clue: '环球金融中心正门对面，第三盏路灯旁的长椅下', lat: baseLat + 0.004, lng: baseLng + 0.008, points: 130, difficulty: 2, timeLimit: 86400000 },
    { id: uuidv4(), name: '新天地旧影', description: '石库门里的旧时光', clue: '老弄堂第七号门牌，窗台花盆之下', lat: baseLat - 0.001, lng: baseLng + 0.002, points: 90, difficulty: 1, timeLimit: 86400000 },
    { id: uuidv4(), name: '世博园遗迹', description: '昔日盛会留下的宝藏', clue: '中国馆北侧，第五棵银杏树下的石板', lat: baseLat - 0.006, lng: baseLng + 0.007, points: 110, difficulty: 2, timeLimit: 86400000 },
    { id: uuidv4(), name: '武康路洋房', description: '法租界老洋房的秘密', clue: '武康大楼拱门内侧，左墙第三块砖', lat: baseLat - 0.002, lng: baseLng - 0.003, points: 170, difficulty: 3, timeLimit: 86400000 },
    { id: uuidv4(), name: '苏州河畔', description: '河畔老仓库的秘密', clue: '四行仓库对面，河堤第三根灯柱下', lat: baseLat + 0.005, lng: baseLng - 0.002, points: 140, difficulty: 3, timeLimit: 86400000 },
    { id: uuidv4(), name: '龙华古塔', description: '千年古塔的守护秘密', clue: '塔影所指方向，走三十步，左转见古井', lat: baseLat - 0.008, lng: baseLng - 0.001, points: 220, difficulty: 5, timeLimit: 86400000 },
  ];
  return tasks;
}

let db: Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>>;

async function initDb() {
  db = await JSONFilePreset<DbSchema>(DB_FILE, defaultData);
  if (db.data.tasks.length === 0) {
    db.data.tasks = generateCityTasks();
    await db.write();
  }
  checkExpiredTasks();
}

function checkExpiredTasks() {
  const now = Date.now();
  let changed = false;
  for (const ut of db.data.userTasks) {
    if (ut.status === 'active') {
      const task = db.data.tasks.find(t => t.id === ut.taskId);
      if (task && (now - ut.acceptedAt) > task.timeLimit) {
        ut.status = 'failed';
        changed = true;
      }
    }
  }
  if (changed) {
    db.write();
  }
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  const existing = db.data.users.find(u => u.username === username);
  if (existing) {
    res.status(409).json({ error: '用户名已存在' });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user: User = {
    id: uuidv4(),
    username,
    password: hashed,
    points: 0,
    level: 1,
    achievements: [],
  };
  db.data.users.push(user);
  await db.write();
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, points: user.points, level: user.level, achievements: user.achievements } });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.data.users.find(u => u.username === username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, points: user.points, level: user.level, achievements: user.achievements } });
});

app.get('/api/tasks', authMiddleware, (req, res) => {
  checkExpiredTasks();
  const userId = (req as any).userId;
  const userTasks = db.data.userTasks.filter(ut => ut.userId === userId);
  const tasks = db.data.tasks.map(task => {
    const ut = userTasks.find(t => t.taskId === task.id);
    return {
      ...task,
      userStatus: ut ? ut.status : null,
      acceptedAt: ut ? ut.acceptedAt : null,
      userTaskId: ut ? ut.id : null,
    };
  });
  res.json(tasks);
});

app.post('/api/tasks/:id/accept', authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const taskId = req.params.id;
  const task = db.data.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  const existing = db.data.userTasks.find(ut => ut.taskId === taskId && ut.userId === userId && ut.status === 'active');
  if (existing) {
    res.status(400).json({ error: '已经接取了该任务' });
    return;
  }
  const failedExisting = db.data.userTasks.find(ut => ut.taskId === taskId && ut.userId === userId && ut.status === 'failed');
  if (failedExisting) {
    const user = db.data.users.find(u => u.id === userId)!;
    if (user.points < 5) {
      res.status(400).json({ error: '积分不足，重新接取需消耗5积分' });
      return;
    }
    user.points -= 5;
    failedExisting.status = 'active';
    failedExisting.acceptedAt = Date.now();
    await db.write();
    res.json({ userTask: failedExisting, user: { id: user.id, username: user.username, points: user.points, level: user.level, achievements: user.achievements } });
    return;
  }
  const userTask: UserTask = {
    id: uuidv4(),
    taskId,
    userId,
    acceptedAt: Date.now(),
    status: 'active',
  };
  db.data.userTasks.push(userTask);
  await db.write();
  const user = db.data.users.find(u => u.id === userId)!;
  res.json({ userTask, user: { id: user.id, username: user.username, points: user.points, level: user.level, achievements: user.achievements } });
});

app.post('/api/tasks/:id/submit', authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const taskId = req.params.id;
  const { lat, lng } = req.body;
  const task = db.data.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  const userTask = db.data.userTasks.find(ut => ut.taskId === taskId && ut.userId === userId && ut.status === 'active');
  if (!userTask) {
    res.status(400).json({ error: '未接取该任务或任务已过期' });
    return;
  }
  const R = 6371000;
  const dLat = (lat - task.lat) * Math.PI / 180;
  const dLng = (lng - task.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(task.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const success = distance <= 20;
  const user = db.data.users.find(u => u.id === userId)!;

  if (success) {
    userTask.status = 'completed';
    user.points += task.points;
    if (task.points > 0) {
      user.level = Math.floor(user.points / 200) + 1;
    }
    const completedCount = db.data.userTasks.filter(ut => ut.userId === userId && ut.status === 'completed').length;
    const precisionCount = db.data.userTasks.filter(ut => ut.userId === userId && ut.status === 'completed').length;
    if (completedCount === 1 && !user.achievements.includes('first-find')) {
      user.achievements.push('first-find');
    }
    if (distance <= 10 && !user.achievements.includes('sharpshooter')) {
      user.achievements.push('sharpshooter');
    }
    const hour = new Date().getHours();
    if ((hour >= 22 || hour < 5) && !user.achievements.includes('night-owl')) {
      user.achievements.push('night-owl');
    }
    if (completedCount >= 5 && !user.achievements.includes('collector')) {
      user.achievements.push('collector');
    }
    if (completedCount >= 10 && !user.achievements.includes('master')) {
      user.achievements.push('master');
    }
  }

  await db.write();
  res.json({
    distance: Math.round(distance * 10) / 10,
    success,
    points: success ? task.points : 0,
    user: { id: user.id, username: user.username, points: user.points, level: user.level, achievements: user.achievements },
  });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const user = db.data.users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  const completedTasks = db.data.userTasks.filter(ut => ut.userId === userId && ut.status === 'completed');
  const achievements = db.data.achievements.filter(a => user.achievements.includes(a.id));
  res.json({
    id: user.id,
    username: user.username,
    points: user.points,
    level: user.level,
    userAchievements: achievements,
    completedCount: completedTasks.length,
    totalTasks: db.data.tasks.length,
  });
});

app.get('/api/achievements', authMiddleware, (req, res) => {
  res.json(db.data.achievements);
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});

initDb();
