import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DatabaseSchema, Exploration, Comment, Favorite, User } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|gif|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片文件'));
  },
});

const dbFile = path.join(__dirname, '..', 'db.json');
const defaultData: DatabaseSchema = {
  users: [
    { id: 'user-local', nickname: '城市漫游者', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cityexplorer' },
  ],
  explorations: [
    {
      id: 'exp-seed-1',
      title: '巷弄里的手冲咖啡馆',
      description: '隐藏在老城区巷子深处，由老宅改造而成，木质装修搭配绿植，手冲豆子来自云南保山，口感回甘悠长。店主是位友善的资深咖啡师，会耐心讲解每一款豆子的风味。店内有一只慵懒的橘猫，常常趴在窗台晒太阳。',
      type: 'cafe',
      images: [],
      lat: 39.9087,
      lng: 116.3975,
      address: '北京市东城区方砖厂胡同18号',
      ratingCount: 12,
      ratingSum: 56,
      avgRating: 4.7,
      visitCount: 156,
      createdBy: 'user-local',
      createdAt: Date.now() - 86400000 * 14,
      updatedAt: Date.now() - 86400000 * 14,
    },
    {
      id: 'exp-seed-2',
      title: '百年老建筑里的独立书店',
      description: '坐落于一座1920年代建成的英式老洋房内，三层木质阁楼藏书数万册。二楼有专门的诗歌区和阅读沙发，窗外是爬满藤蔓的小院子，雨天来这里读书别有风味。',
      type: 'bookstore',
      images: [],
      lat: 31.2304,
      lng: 121.4737,
      address: '上海市徐汇区武康路210号',
      ratingCount: 8,
      ratingSum: 38,
      avgRating: 4.8,
      visitCount: 203,
      createdBy: 'user-local',
      createdAt: Date.now() - 86400000 * 21,
      updatedAt: Date.now() - 86400000 * 21,
    },
    {
      id: 'exp-seed-3',
      title: '艺术街区的巨型涂鸦墙',
      description: '798附近新开放的街头艺术区，一整面50米长的涂鸦墙，每月会有艺术家重新创作。本期主题是"城市梦境"，色彩斑斓，非常适合拍照打卡。',
      type: 'graffiti',
      images: [],
      lat: 39.9847,
      lng: 116.4950,
      address: '北京市朝阳区酒仙桥路4号798艺术区西街',
      ratingCount: 5,
      ratingSum: 23,
      avgRating: 4.6,
      visitCount: 89,
      createdBy: 'user-local',
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000 * 7,
    },
    {
      id: 'exp-seed-4',
      title: '民国时期的巴洛克小洋楼',
      description: '低调地藏身于居民区深处，外墙被爬山虎覆盖了大半，石雕阳台和铁艺大门保存完好。目前作为小众展览馆开放，展览老上海生活物件。',
      type: 'architecture',
      images: [],
      lat: 31.2200,
      lng: 121.4500,
      address: '上海市静安区愚园路395弄',
      ratingCount: 3,
      ratingSum: 14,
      avgRating: 4.7,
      visitCount: 67,
      createdBy: 'user-local',
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'exp-seed-5',
      title: '地下室里的手工皮具工作室',
      description: '一间没有招牌的小店，入口藏在便利店旁的铁门里。店主老陈做了二十年皮具，可定制钱包、手账皮套和背包。作品工艺扎实，养出来的皮色非常漂亮。',
      type: 'hidden_shop',
      images: [],
      lat: 22.5431,
      lng: 114.0579,
      address: '深圳市南山区南头古城南区B12',
      ratingCount: 6,
      ratingSum: 28,
      avgRating: 4.7,
      visitCount: 45,
      createdBy: 'user-local',
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 10,
    },
  ],
  comments: [
    {
      id: 'cm-seed-1',
      explorationId: 'exp-seed-1',
      userId: 'user-local',
      userName: '城市漫游者',
      userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cityexplorer',
      content: '周末慕名前来，果然不虚此行！推荐耶加雪菲，果香很明显。店里环境很安静，适合带本书泡一下午。',
      images: [],
      rating: 5,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'cm-seed-2',
      explorationId: 'exp-seed-2',
      userId: 'user-local',
      userName: '城市漫游者',
      userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cityexplorer',
      content: '老洋房的氛围太绝了，木楼梯踩上去吱呀作响，特别有年代感。买了一本绝版的诗集，开心！',
      images: [],
      rating: 5,
      createdAt: Date.now() - 86400000 * 5,
    },
  ],
  favorites: [],
};

const db = new Low<DatabaseSchema>(new JSONFile<DatabaseSchema>(dbFile), defaultData);
await db.read();
if (!db.data || !db.data.explorations) db.data = defaultData;
await db.write();

function calcAvg(e: Exploration) {
  if (e.ratingCount === 0) return 0;
  return Math.round((e.ratingSum / e.ratingCount) * 10) / 10;
}

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get('/api/explorations', async (_req, res) => {
  await db.read();
  res.json(db.data!.explorations);
});

app.get('/api/explorations/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const userId = req.query.userId as string || 'user-local';
  const exploration = db.data!.explorations.find((e) => e.id === id);
  if (!exploration) return res.status(404).json({ error: '未找到该探险点' });
  const comments = db.data!.comments
    .filter((c) => c.explorationId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  comments.forEach((c) => {
    if (c.rating >= 1 && c.rating <= 5) ratingDistribution[c.rating]++;
  });
  const isFavorited = db.data!.favorites.some(
    (f) => f.explorationId === id && f.userId === userId
  );
  res.json({ exploration, comments, ratingDistribution, isFavorited });
});

app.post('/api/explorations', async (req, res) => {
  await db.read();
  const body = req.body as Partial<Exploration>;
  const now = Date.now();
  const newExp: Exploration = {
    id: 'exp-' + uuidv4().slice(0, 10),
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    type: body.type || 'other',
    images: Array.isArray(body.images) ? body.images : [],
    lat: Number(body.lat) || 0,
    lng: Number(body.lng) || 0,
    address: body.address ? String(body.address) : undefined,
    ratingCount: 0,
    ratingSum: 0,
    avgRating: 0,
    visitCount: 0,
    createdBy: body.createdBy || 'user-local',
    createdAt: now,
    updatedAt: now,
  };
  if (!newExp.title || !newExp.type || !newExp.lat || !newExp.lng) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  db.data!.explorations.push(newExp);
  await db.write();
  res.status(201).json(newExp);
});

app.put('/api/explorations/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const idx = db.data!.explorations.findIndex((e) => e.id === id);
  if (idx < 0) return res.status(404).json({ error: '未找到' });
  const body = req.body;
  db.data!.explorations[idx] = {
    ...db.data!.explorations[idx],
    title: body.title !== undefined ? String(body.title).trim() : db.data!.explorations[idx].title,
    description: body.description !== undefined ? String(body.description).trim() : db.data!.explorations[idx].description,
    type: body.type || db.data!.explorations[idx].type,
    images: Array.isArray(body.images) ? body.images : db.data!.explorations[idx].images,
    lat: body.lat !== undefined ? Number(body.lat) : db.data!.explorations[idx].lat,
    lng: body.lng !== undefined ? Number(body.lng) : db.data!.explorations[idx].lng,
    address: body.address !== undefined ? String(body.address) : db.data!.explorations[idx].address,
    updatedAt: Date.now(),
  };
  await db.write();
  res.json(db.data!.explorations[idx]);
});

app.delete('/api/explorations/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  db.data!.explorations = db.data!.explorations.filter((e) => e.id !== id);
  db.data!.comments = db.data!.comments.filter((c) => c.explorationId !== id);
  db.data!.favorites = db.data!.favorites.filter((f) => f.explorationId !== id);
  await db.write();
  res.json({ ok: true });
});

app.post('/api/explorations/:id/visit', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const exp = db.data!.explorations.find((e) => e.id === id);
  if (!exp) return res.status(404).json({ error: '未找到' });
  exp.visitCount += 1;
  await db.write();
  res.json({ visitCount: exp.visitCount });
});

app.post('/api/comments', async (req, res) => {
  await db.read();
  const body = req.body;
  const now = Date.now();
  const comment: Comment = {
    id: 'cm-' + uuidv4().slice(0, 10),
    explorationId: String(body.explorationId),
    userId: String(body.userId || 'user-local'),
    userName: String(body.userName || '匿名用户'),
    userAvatar: String(body.userAvatar || ''),
    content: String(body.content || '').trim(),
    images: Array.isArray(body.images) ? body.images : [],
    rating: Math.max(1, Math.min(5, Number(body.rating) || 0)),
    createdAt: now,
  };
  if (!comment.content || !comment.rating) return res.status(400).json({ error: '内容和评分必填' });
  db.data!.comments.push(comment);
  const exp = db.data!.explorations.find((e) => e.id === comment.explorationId);
  if (exp) {
    exp.ratingCount += 1;
    exp.ratingSum += comment.rating;
    exp.avgRating = calcAvg(exp);
    exp.updatedAt = now;
  }
  await db.write();
  res.status(201).json(comment);
});

app.delete('/api/comments/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const cm = db.data!.comments.find((c) => c.id === id);
  if (!cm) return res.status(404).json({ error: '未找到' });
  const exp = db.data!.explorations.find((e) => e.id === cm.explorationId);
  if (exp) {
    exp.ratingCount = Math.max(0, exp.ratingCount - 1);
    exp.ratingSum = Math.max(0, exp.ratingSum - cm.rating);
    exp.avgRating = calcAvg(exp);
  }
  db.data!.comments = db.data!.comments.filter((c) => c.id !== id);
  await db.write();
  res.json({ ok: true });
});

app.get('/api/favorites', async (req, res) => {
  await db.read();
  const userId = (req.query.userId as string) || 'user-local';
  const favIds = db.data!.favorites
    .filter((f) => f.userId === userId)
    .map((f) => f.explorationId);
  const list = db.data!.explorations.filter((e) => favIds.includes(e.id));
  res.json(list);
});

app.post('/api/favorites/:explorationId', async (req, res) => {
  await db.read();
  const { explorationId } = req.params;
  const userId = (req.body.userId as string) || 'user-local';
  const exists = db.data!.favorites.find(
    (f) => f.explorationId === explorationId && f.userId === userId
  );
  if (exists) return res.json({ favorited: true });
  const fav: Favorite = {
    id: 'fav-' + uuidv4().slice(0, 10),
    explorationId,
    userId,
    createdAt: Date.now(),
  };
  db.data!.favorites.push(fav);
  await db.write();
  res.status(201).json({ favorited: true });
});

app.delete('/api/favorites/:explorationId', async (req, res) => {
  await db.read();
  const { explorationId } = req.params;
  const userId = (req.query.userId as string) || 'user-local';
  db.data!.favorites = db.data!.favorites.filter(
    (f) => !(f.explorationId === explorationId && f.userId === userId)
  );
  await db.write();
  res.json({ favorited: false });
});

app.get('/api/mine/explorations', async (req, res) => {
  await db.read();
  const userId = (req.query.userId as string) || 'user-local';
  const list = db.data!.explorations
    .filter((e) => e.createdBy === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(list);
});

app.get('/api/users/:id', async (req, res) => {
  await db.read();
  const user = db.data!.users.find((u: User) => u.id === req.params.id) || db.data!.users[0];
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`🏙️  城迹探索 API 服务启动: http://localhost:${PORT}`);
});
