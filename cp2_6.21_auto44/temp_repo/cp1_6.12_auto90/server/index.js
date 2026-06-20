import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ==================== 预设员工数据 ====================
const USERS = [
  { id: 'u1',  name: '张明远' },
  { id: 'u2',  name: '李思涵' },
  { id: 'u3',  name: '王子轩' },
  { id: 'u4',  name: '赵雨欣' },
  { id: 'u5',  name: '陈浩然' },
  { id: 'u6',  name: '刘雅婷' },
  { id: 'u7',  name: '周俊杰' },
  { id: 'u8',  name: '吴晓梦' },
  { id: 'u9',  name: '郑凯文' },
  { id: 'u10', name: '孙若曦' },
];

// ==================== 座号分配 ====================
function getSeatByUserId(userId) {
  const index = USERS.findIndex(u => u.id === userId);
  if (index === -1) return { seatX: 0, seatY: 0 };
  const seatX = index % 10;
  const seatY = Math.floor(index / 10);
  return { seatX, seatY };
}

// ==================== 内存数据存储 ====================
let preferencesDB = [];

// ==================== GET /api/users ====================
app.get('/api/users', (req, res) => {
  res.json({ users: USERS });
});

// ==================== GET /api/preferences ====================
app.get('/api/preferences', (req, res) => {
  res.json({ preferences: preferencesDB });
});

// ==================== POST /api/preferences ====================
app.post('/api/preferences', (req, res) => {
  const { userId, seatX, seatY, preferences } = req.body || {};

  if (!userId || !preferences) {
    return res.status(400).json({ success: false, message: '缺少必要字段' });
  }

  const user = USERS.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const seat = seatX !== undefined && seatY !== undefined
    ? { seatX, seatY }
    : getSeatByUserId(userId);

  const existingIndex = preferencesDB.findIndex(r => r.userId === userId);
  const record = {
    id: existingIndex >= 0 ? preferencesDB[existingIndex].id : uuidv4(),
    userId,
    seatX: seat.seatX,
    seatY: seat.seatY,
    preferences,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    preferencesDB[existingIndex] = record;
  } else {
    preferencesDB.push(record);
  }

  res.json({ success: true, record });
});

app.listen(PORT, () => {
  console.log(`[server] 后端服务已启动: http://localhost:${PORT}`);
});
