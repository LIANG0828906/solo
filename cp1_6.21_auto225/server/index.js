import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

let db = {
  users: [],
  plans: [],
  records: [],
  tokens: {},
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(raw);
      if (!db.tokens) db.tokens = {};
    }
  } catch (e) {
    console.log('加载数据文件失败，使用空数据');
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.log('保存数据失败');
  }
}

loadData();

const app = express();
app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !db.tokens[token]) {
    return res.status(401).json({ error: '未授权' });
  }
  req.userId = db.tokens[token];
  next();
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (db.users.find((u) => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  const user = { id: uuidv4(), username, password };
  db.users.push(user);
  saveData();
  const token = uuidv4();
  db.tokens[token] = user.id;
  saveData();
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = uuidv4();
  db.tokens[token] = user.id;
  saveData();
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.get('/api/plans', authMiddleware, (req, res) => {
  const plans = db.plans.filter((p) => p.userId === req.userId);
  res.json(plans);
});

app.post('/api/plans', authMiddleware, (req, res) => {
  const { name, exercises } = req.body;
  if (!name || name.length > 30) {
    return res.status(400).json({ error: '计划名称无效（最多30字符）' });
  }
  if (!Array.isArray(exercises) || exercises.length < 5 || exercises.length > 15) {
    return res.status(400).json({ error: '动作数量需在5-15个之间' });
  }
  const plan = {
    id: uuidv4(),
    userId: req.userId,
    name,
    exercises,
    createdAt: new Date().toISOString(),
  };
  db.plans.push(plan);
  saveData();
  res.status(201).json(plan);
});

app.put('/api/plans/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, exercises } = req.body;
  const index = db.plans.findIndex((p) => p.id === id && p.userId === req.userId);
  if (index === -1) {
    return res.status(404).json({ error: '计划不存在' });
  }
  if (name && name.length > 30) {
    return res.status(400).json({ error: '计划名称无效（最多30字符）' });
  }
  if (exercises && (exercises.length < 5 || exercises.length > 15)) {
    return res.status(400).json({ error: '动作数量需在5-15个之间' });
  }
  db.plans[index] = {
    ...db.plans[index],
    name: name || db.plans[index].name,
    exercises: exercises || db.plans[index].exercises,
    updatedAt: new Date().toISOString(),
  };
  saveData();
  res.json(db.plans[index]);
});

app.delete('/api/plans/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const initialLen = db.plans.length;
  db.plans = db.plans.filter((p) => !(p.id === id && p.userId === req.userId));
  if (db.plans.length === initialLen) {
    return res.status(404).json({ error: '计划不存在' });
  }
  db.records = db.records.filter((r) => !(r.planId === id && r.userId === req.userId));
  saveData();
  res.json({ success: true });
});

app.get('/api/records', authMiddleware, (req, res) => {
  const { planId, date } = req.query;
  let records = db.records.filter((r) => r.userId === req.userId);
  if (planId) records = records.filter((r) => r.planId === planId);
  if (date) records = records.filter((r) => r.date === date);
  res.json(records);
});

app.post('/api/records', authMiddleware, (req, res) => {
  const { planId, date, exerciseRecords } = req.body;
  if (!planId || !date || !Array.isArray(exerciseRecords)) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const existing = db.records.findIndex(
    (r) => r.planId === planId && r.date === date && r.userId === req.userId
  );
  const record = {
    id: uuidv4(),
    userId: req.userId,
    planId,
    date,
    exerciseRecords,
    createdAt: new Date().toISOString(),
  };
  if (existing !== -1) {
    db.records[existing] = { ...db.records[existing], ...record, id: db.records[existing].id };
  } else {
    db.records.push(record);
  }
  saveData();
  res.status(201).json(existing !== -1 ? db.records[existing] : record);
});

app.delete('/api/records/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const initialLen = db.records.length;
  db.records = db.records.filter((r) => !(r.id === id && r.userId === req.userId));
  if (db.records.length === initialLen) {
    return res.status(404).json({ error: '记录不存在' });
  }
  saveData();
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`训练日志本后端运行在 http://localhost:${PORT}`);
});
