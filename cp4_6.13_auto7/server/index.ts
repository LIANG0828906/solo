import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocket } from 'ws';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupWebSocket } from './wsHandler';
import { startMatcher } from './matcher';

interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  bio: string;
  location: { lat: number; lng: number };
  tastePrefs: {
    spiciness: 0 | 1 | 2 | 3;
    cuisines: string[];
    restrictions: string[];
  };
  availableSlots: ('breakfast' | 'lunch' | 'dinner' | 'supper')[];
  deliveryRadius: number;
  createdAt: number;
}

interface MealComment {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
}

interface Meal {
  id: string;
  publisherId: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  servings: number;
  remainingServings: number;
  location: { lat: number; lng: number };
  address: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'supper';
  expiresAt: number;
  createdAt: number;
  likes: string[];
  comments: MealComment[];
}

interface MatchRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  mealId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  type: 'text' | 'emoji' | 'image';
  content: string;
  createdAt: number;
  readBy: string[];
}

interface Chat {
  id: string;
  requestId: string;
  participants: string[];
  expiresAt: number;
  messages: ChatMessage[];
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let __dirname: string;
try {
  __dirname = path.dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname = __dirname || path.resolve();
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const users = new Map<string, User>();
const meals = new Map<string, Meal>();
const chats = new Map<string, Chat>();
const matchRequests = new Map<string, MatchRequest>();
const wsConnections = new Map<string, WebSocket>();

const stores = {
  users,
  meals,
  chats,
  matchRequests,
  wsConnections,
};

const wsHandler = setupWebSocket(server, stores);
startMatcher(stores, wsHandler);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, _file, cb) => {
    const uniqueName = generateUUID() + path.extname(_file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '未上传图片' });
      return;
    }
    const originalPath = req.file.path;
    const ext = path.extname(req.file.filename);
    const compressedName = generateUUID() + ext;
    const compressedPath = path.join(uploadsDir, compressedName);

    await sharp(originalPath)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(compressedPath);

    try {
      fs.unlinkSync(originalPath);
    } catch {}

    const url = `/uploads/${compressedName}`;
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: '图片处理失败' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, avatar, bio, location, tastePrefs, availableSlots, deliveryRadius } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码必填' });
    return;
  }
  for (const u of users.values()) {
    if (u.username === username) {
      res.status(409).json({ error: '用户名已存在' });
      return;
    }
  }
  const user: User = {
    id: generateUUID(),
    username,
    password,
    avatar: avatar || '',
    bio: bio || '',
    location: location || { lat: 0, lng: 0 },
    tastePrefs: tastePrefs || { spiciness: 0, cuisines: [], restrictions: [] },
    availableSlots: availableSlots || [],
    deliveryRadius: typeof deliveryRadius === 'number' ? deliveryRadius : 5,
    createdAt: Date.now(),
  };
  users.set(user.id, user);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码必填' });
    return;
  }
  let found: User | undefined;
  for (const u of users.values()) {
    if (u.username === username) {
      found = u;
      break;
    }
  }
  if (!found) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  if (found.password !== password) {
    res.status(401).json({ error: '密码错误' });
    return;
  }
  const { password: _, ...userWithoutPassword } = found;
  res.json({ user: userWithoutPassword });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.put('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  const { avatar, bio, location, tastePrefs, availableSlots, deliveryRadius } = req.body;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (location !== undefined) user.location = location;
  if (tastePrefs !== undefined) user.tastePrefs = tastePrefs;
  if (availableSlots !== undefined) user.availableSlots = availableSlots;
  if (deliveryRadius !== undefined) user.deliveryRadius = deliveryRadius;
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.get('/api/meals', (_req, res) => {
  const now = Date.now();
  const result: any[] = [];
  for (const meal of meals.values()) {
    if (meal.expiresAt <= now) continue;
    const publisher = users.get(meal.publisherId);
    const publisherSafe = publisher
      ? (() => { const { password: _, ...rest } = publisher; return rest; })()
      : undefined;
    result.push({ ...meal, publisher: publisherSafe });
  }
  result.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ meals: result });
});

app.post('/api/meals', (req, res) => {
  const {
    publisherId, name, description, tags, images, servings,
    location, address, mealTime, expiresInHours,
  } = req.body;
  if (!publisherId || !name) {
    res.status(400).json({ error: '发布者和餐食名称必填' });
    return;
  }
  if (!users.has(publisherId)) {
    res.status(404).json({ error: '发布者不存在' });
    return;
  }
  const now = Date.now();
  const expiresHours = typeof expiresInHours === 'number' ? expiresInHours : 2;
  const meal: Meal = {
    id: generateUUID(),
    publisherId,
    name,
    description: description || '',
    tags: tags || [],
    images: images || [],
    servings: typeof servings === 'number' ? servings : 1,
    remainingServings: typeof servings === 'number' ? servings : 1,
    location: location || { lat: 0, lng: 0 },
    address: address || '',
    mealTime: mealTime || 'lunch',
    expiresAt: now + expiresHours * 60 * 60 * 1000,
    createdAt: now,
    likes: [],
    comments: [],
  };
  meals.set(meal.id, meal);
  const publisher = users.get(meal.publisherId);
  const publisherSafe = publisher
    ? (() => { const { password: _, ...rest } = publisher; return rest; })()
    : undefined;
  res.json({ meal: { ...meal, publisher: publisherSafe } });
});

app.get('/api/meals/:id', (req, res) => {
  const meal = meals.get(req.params.id);
  if (!meal) {
    res.status(404).json({ error: '餐食不存在' });
    return;
  }
  const publisher = users.get(meal.publisherId);
  const publisherSafe = publisher
    ? (() => { const { password: _, ...rest } = publisher; return rest; })()
    : undefined;
  res.json({ meal: { ...meal, publisher: publisherSafe } });
});

app.post('/api/meals/:id/like', (req, res) => {
  const meal = meals.get(req.params.id);
  if (!meal) {
    res.status(404).json({ error: '餐食不存在' });
    return;
  }
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId 必填' });
    return;
  }
  const idx = meal.likes.indexOf(userId);
  if (idx >= 0) {
    meal.likes.splice(idx, 1);
  } else {
    meal.likes.push(userId);
  }
  res.json({ likes: meal.likes });
});

app.post('/api/meals/:id/comment', (req, res) => {
  const meal = meals.get(req.params.id);
  if (!meal) {
    res.status(404).json({ error: '餐食不存在' });
    return;
  }
  const { userId, content } = req.body;
  if (!userId || !content) {
    res.status(400).json({ error: 'userId 和 content 必填' });
    return;
  }
  const comment: MealComment = {
    id: generateUUID(),
    userId,
    content,
    createdAt: Date.now(),
  };
  meal.comments.push(comment);
  res.json({ comment });
});

app.post('/api/match-requests', (req, res) => {
  const { requesterId, receiverId, mealId } = req.body;
  if (!requesterId || !receiverId || !mealId) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  if (!users.has(requesterId) || !users.has(receiverId)) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  if (!meals.has(mealId)) {
    res.status(404).json({ error: '餐食不存在' });
    return;
  }
  const request: MatchRequest = {
    id: generateUUID(),
    requesterId,
    receiverId,
    mealId,
    status: 'pending',
    createdAt: Date.now(),
  };
  matchRequests.set(request.id, request);
  wsHandler.sendToUser(receiverId, {
    type: 'MATCH_REQUEST',
    request,
  });
  res.json({ request });
});

app.post('/api/match-requests/:id/accept', (req, res) => {
  const request = matchRequests.get(req.params.id);
  if (!request) {
    res.status(404).json({ error: '请求不存在' });
    return;
  }
  if (request.status !== 'pending') {
    res.status(400).json({ error: '请求已处理' });
    return;
  }
  request.status = 'accepted';
  const chat: Chat = {
    id: generateUUID(),
    requestId: request.id,
    participants: [request.requesterId, request.receiverId],
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    messages: [],
  };
  chats.set(chat.id, chat);
  const requester = users.get(request.requesterId);
  const receiver = users.get(request.receiverId);
  if (requester) {
    const { password: _, ...safe } = requester;
    wsHandler.sendToUser(request.receiverId, {
      type: 'REQUEST_ACCEPTED',
      chatId: chat.id,
      partner: safe,
    });
  }
  if (receiver) {
    const { password: _, ...safe } = receiver;
    wsHandler.sendToUser(request.requesterId, {
      type: 'REQUEST_ACCEPTED',
      chatId: chat.id,
      partner: safe,
    });
  }
  res.json({ chat });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
