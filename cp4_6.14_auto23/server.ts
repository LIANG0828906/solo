import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  nickname: string;
  points: number;
  createdAt: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  location: string;
  maxParticipants: number;
  creatorId: string;
  createdAt: string;
}

interface Registration {
  id: string;
  activityId: string;
  userId: string;
  status: 'registered' | 'checked-in';
  registeredAt: string;
  checkedInAt: string | null;
}

const usersMap = new Map<string, User>();
const activitiesMap = new Map<string, Activity>();
const registrationsMap = new Map<string, Registration>();
const tokensMap = new Map<string, string>();

const avatarColors = ['#52B788', '#40916C', '#2D6A4F', '#D4A373', '#A67B5B', '#8B5A2B'];

const seedUsers: Omit<User, 'id' | 'createdAt'>[] = [
  { username: 'admin', password: '123456', nickname: '环保大使', avatar: avatarColors[0], points: 320 },
  { username: 'greenlover', password: '123456', nickname: '绿色爱好者', avatar: avatarColors[1], points: 150 },
  { username: 'earthkeeper', password: '123456', nickname: '地球守护者', avatar: avatarColors[2], points: 680 },
];

seedUsers.forEach((u) => {
  const id = uuidv4();
  usersMap.set(id, { ...u, id, createdAt: new Date().toISOString() });
});

const coverImages = [
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
  'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80',
  'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80',
  'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80',
  'https://images.unsplash.com/photo-1596464716090-8633360792e5?w=800&q=80',
  'https://images.unsplash.com/photo-1627856014754-2907e2355d0d?w=800&q=80',
];

const sampleDescriptions = [
  '<p>让我们一起<strong>清理公园垃圾</strong>，还公园一片洁净！活动将提供手套、垃圾袋等工具，期待您的参与。</p><ul><li>集合时间：上午9点</li><li>集合地点：南门入口</li><li>活动时长：约2小时</li></ul><p><em>保护环境，人人有责！</em></p>',
  '<p>本次活动旨在<strong>推广垃圾分类知识</strong>，通过互动游戏和现场演示，让居民掌握正确的分类方法。</p><ul><li>专业讲师讲解</li><li>分类游戏体验</li><li>精美小礼品赠送</li></ul>',
  '<p>家里的旧物不要扔！带来<strong>旧物回收兑换</strong>活动，可以兑换积分或生活用品。</p><ul><li>可回收物品：衣物、书籍、电子产品</li><li>兑换比例：现场公示</li><li>所有物品将用于公益捐赠</li></ul>',
  '<p>与孩子一起<strong>种下希望之树</strong>，培养环保意识，为地球增添一片绿色。</p><ul><li>树苗工具全包</li><li>专业人员指导</li><li>颁发植树纪念证书</li></ul>',
  '<p>沿<strong>河岸徒步</strong>同时清理垃圾，欣赏美景+保护环境一举两得！</p><ul><li>路线：约5公里</li><li>难度：轻松级</li><li>提供饮用水</li></ul>',
];

const seedActivitiesData = [
  { title: '朝阳公园清洁日', date: '2026-06-21T09:00', location: '北京市朝阳区朝阳公园南门', maxParticipants: 50 },
  { title: '社区垃圾分类宣传周', date: '2026-06-28T14:00', location: '上海市浦东新区张江社区中心', maxParticipants: 30 },
  { title: '旧物回收兑换市集', date: '2026-07-05T10:00', location: '广州市天河区体育西路广场', maxParticipants: 100 },
  { title: '亲子植树公益活动', date: '2026-07-12T08:30', location: '深圳市龙岗区生态公园', maxParticipants: 40 },
  { title: '河道环保徒步清洁', date: '2026-07-19T07:00', location: '杭州市西湖区沿山河步道', maxParticipants: 60 },
  { title: '绿色骑行低碳生活', date: '2026-07-26T09:00', location: '成都市天府绿道起点', maxParticipants: 80 },
  { title: '海滩垃圾清理行动', date: '2026-08-02T08:00', location: '青岛市黄岛区金沙滩', maxParticipants: 70 },
  { title: '校园环保知识竞赛', date: '2026-08-09T14:00', location: '南京市鼓楼区南京大学礼堂', maxParticipants: 200 },
  { title: '社区花园共建计划', date: '2026-08-16T09:30', location: '武汉市武昌区水果湖社区', maxParticipants: 35 },
  { title: '节能减碳讲座', date: '2026-08-23T15:00', location: '西安市雁塔区科技馆', maxParticipants: 120 },
];

const userIds = Array.from(usersMap.keys());

seedActivitiesData.forEach((act, idx) => {
  const id = uuidv4();
  activitiesMap.set(id, {
    id,
    title: act.title,
    description: sampleDescriptions[idx % sampleDescriptions.length],
    coverImage: coverImages[idx % coverImages.length],
    date: act.date,
    location: act.location,
    maxParticipants: act.maxParticipants,
    creatorId: userIds[idx % userIds.length],
    createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
  });
});

activitiesMap.forEach((act, actId) => {
  const randomCount = Math.floor(Math.random() * Math.min(act.maxParticipants, 15));
  for (let i = 0; i < randomCount; i++) {
    const userId = userIds[i % userIds.length];
    if (userId === act.creatorId) continue;
    const existing = Array.from(registrationsMap.values()).find(
      (r) => r.activityId === actId && r.userId === userId
    );
    if (!existing) {
      registrationsMap.set(uuidv4(), {
        id: uuidv4(),
        activityId: actId,
        userId,
        status: 'registered',
        registeredAt: new Date().toISOString(),
        checkedInAt: null,
      });
    }
  }
});

function extractUserId(token: string | undefined): string | null {
  if (!token) return null;
  const bearer = token.startsWith('Bearer ') ? token.slice(7) : token;
  const userId = tokensMap.get(bearer);
  return userId || null;
}

function authRequired(req: Request, res: Response, next: NextFunction) {
  const userId = extractUserId(req.headers.authorization);
  if (!userId || !usersMap.has(userId)) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  (req as any).userId = userId;
  next();
}

function sanitizeUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

function getActivityWithStats(activity: Activity, userId: string | null) {
  const regs = Array.from(registrationsMap.values()).filter((r) => r.activityId === activity.id);
  const creator = usersMap.get(activity.creatorId);
  const myReg = userId ? regs.find((r) => r.userId === userId) : null;
  return {
    ...activity,
    registeredCount: regs.length,
    isRegistered: !!myReg,
    isCheckedIn: myReg?.status === 'checked-in' || false,
    creator: creator
      ? { id: creator.id, nickname: creator.nickname, avatar: creator.avatar }
      : { id: '', nickname: '未知用户', avatar: avatarColors[0] },
  };
}

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, nickname } = req.body;
  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  const exists = Array.from(usersMap.values()).find((u) => u.username === username);
  if (exists) {
    return res.status(400).json({ error: '用户名已被占用' });
  }
  const id = uuidv4();
  const user: User = {
    id,
    username,
    password,
    nickname,
    avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    points: 0,
    createdAt: new Date().toISOString(),
  };
  usersMap.set(id, user);
  const token = uuidv4();
  tokensMap.set(token, id);
  res.json({ user: sanitizeUser(user), token });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const user = Array.from(usersMap.values()).find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }
  const token = uuidv4();
  tokensMap.set(token, user.id);
  res.json({ user: sanitizeUser(user), token });
});

app.get('/api/activities', authRequired, (req: Request, res: Response) => {
  const { search = '', sort = 'date' } = req.query as { search: string; sort: string };
  const userId = (req as any).userId;
  let activities = Array.from(activitiesMap.values());
  if (search.trim()) {
    const s = search.toLowerCase();
    activities = activities.filter(
      (a) => a.title.toLowerCase().includes(s) || a.location.toLowerCase().includes(s)
    );
  }
  if (sort === 'date') {
    activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  const result = activities.map((a) => getActivityWithStats(a, userId));
  setTimeout(() => res.json(result), 100);
});

app.get('/api/activities/:id', authRequired, (req: Request, res: Response) => {
  const activity = activitiesMap.get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  const userId = (req as any).userId;
  res.json(getActivityWithStats(activity, userId));
});

app.post('/api/activities', authRequired, (req: Request, res: Response) => {
  const { title, description, coverImage, date, location, maxParticipants } = req.body;
  if (!title || !description || !date || !location || !maxParticipants) {
    return res.status(400).json({ error: '请填写所有必填项' });
  }
  if (maxParticipants < 1 || !Number.isInteger(Number(maxParticipants))) {
    return res.status(400).json({ error: '最大参与人数必须是正整数' });
  }
  const userId = (req as any).userId;
  const id = uuidv4();
  const activity: Activity = {
    id,
    title,
    description,
    coverImage:
      coverImage ||
      `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80`,
    date,
    location,
    maxParticipants: Number(maxParticipants),
    creatorId: userId,
    createdAt: new Date().toISOString(),
  };
  activitiesMap.set(id, activity);
  const user = usersMap.get(userId)!;
  user.points += 50;
  res.json(getActivityWithStats(activity, userId));
});

app.post('/api/activities/:id/register', authRequired, (req: Request, res: Response) => {
  const activity = activitiesMap.get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  const userId = (req as any).userId;
  const regs = Array.from(registrationsMap.values()).filter((r) => r.activityId === activity.id);
  if (regs.length >= activity.maxParticipants) {
    return res.status(400).json({ error: '活动名额已满' });
  }
  if (regs.find((r) => r.userId === userId)) {
    return res.status(400).json({ error: '您已报名该活动' });
  }
  const reg: Registration = {
    id: uuidv4(),
    activityId: activity.id,
    userId,
    status: 'registered',
    registeredAt: new Date().toISOString(),
    checkedInAt: null,
  };
  registrationsMap.set(reg.id, reg);
  res.json({ registration: reg, message: '报名成功！' });
});

app.delete('/api/activities/:id/register', authRequired, (req: Request, res: Response) => {
  const activity = activitiesMap.get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  const userId = (req as any).userId;
  const reg = Array.from(registrationsMap.values()).find(
    (r) => r.activityId === activity.id && r.userId === userId
  );
  if (!reg) {
    return res.status(400).json({ error: '您未报名该活动' });
  }
  registrationsMap.delete(reg.id);
  res.json({ message: '已取消报名' });
});

app.post('/api/activities/:id/checkin', authRequired, (req: Request, res: Response) => {
  const activity = activitiesMap.get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  const userId = (req as any).userId;
  const reg = Array.from(registrationsMap.values()).find(
    (r) => r.activityId === activity.id && r.userId === userId
  );
  if (!reg) {
    return res.status(400).json({ error: '请先报名该活动' });
  }
  if (reg.status === 'checked-in') {
    return res.status(400).json({ error: '您已签到过了' });
  }
  reg.status = 'checked-in';
  reg.checkedInAt = new Date().toISOString();
  const user = usersMap.get(userId)!;
  user.points += 10;
  res.json({ message: '签到成功！获得10积分', points: 10 });
});

app.get('/api/users/me', authRequired, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = usersMap.get(userId)!;
  res.json(sanitizeUser(user));
});

app.get('/api/users/me/activities', authRequired, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const created = Array.from(activitiesMap.values())
    .filter((a) => a.creatorId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const userRegs = Array.from(registrationsMap.values()).filter((r) => r.userId === userId);
  const participated = userRegs
    .map((reg) => {
      const activity = activitiesMap.get(reg.activityId);
      if (!activity) return null;
      return {
        ...getActivityWithStats(activity, userId),
        regStatus: reg.status,
        registeredAt: reg.registeredAt,
        checkedInAt: reg.checkedInAt,
      } as any;
    })
    .filter(Boolean)
    .sort(
      (a: any, b: any) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );

  res.json({ created, participated });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Eco platform backend running on http://localhost:${PORT}`);
  console.log(`Test accounts: admin/123456, greenlover/123456, earthkeeper/123456`);
});

export default app;
