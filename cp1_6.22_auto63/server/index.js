import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const sampleNames = [
  '张伟', '王芳', '李娜', '刘洋', '陈静',
  '杨磊', '赵敏', '黄强', '周婷', '吴鹏',
  '徐明', '孙丽', '马超', '朱军', '胡娟',
  '郭涛', '何琳', '林峰', '罗敏', '梁宇',
];

let participants = sampleNames.map((name) => ({
  id: uuidv4(),
  name,
}));

let history = [];
let roundCounter = 0;

app.get('/api/participants', (_req, res) => {
  res.json({ participants });
});

app.post('/api/draw', (_req, res) => {
  if (participants.length === 0) {
    return res.status(400).json({ error: '没有可抽取的参与者' });
  }
  const index = Math.floor(Math.random() * participants.length);
  const winner = participants[index];
  participants = participants.filter((p) => p.id !== winner.id);
  roundCounter++;
  const record = {
    id: uuidv4(),
    name: winner.name,
    round: roundCounter,
    time: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
  history.unshift(record);
  res.json({ winner, record, remaining: participants.length });
});

app.post('/api/reset', (_req, res) => {
  participants = sampleNames.map((name) => ({
    id: uuidv4(),
    name,
  }));
  history = [];
  roundCounter = 0;
  res.json({ success: true });
});

app.post('/api/add-participant', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '姓名不能为空' });
  }
  const p = { id: uuidv4(), name: name.trim() };
  participants.push(p);
  res.json({ participant: p });
});

app.post('/api/import-list', (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names) || names.length === 0) {
    return res.status(400).json({ error: '导入列表不能为空' });
  }
  const newParticipants = names
    .filter((n) => typeof n === 'string' && n.trim())
    .map((n) => ({ id: uuidv4(), name: n.trim() }));
  participants.push(...newParticipants);
  res.json({ added: newParticipants });
});

app.post('/api/remove-participant', (req, res) => {
  const { id } = req.body;
  participants = participants.filter((p) => p.id !== id);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`抽奖服务器运行在 http://localhost:${PORT}`);
});
