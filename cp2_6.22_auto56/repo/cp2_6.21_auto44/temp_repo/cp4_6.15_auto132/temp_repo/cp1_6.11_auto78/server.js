import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'server', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function readGroup(id) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function writeGroup(group) {
  const filePath = path.join(DATA_DIR, `${group.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(group, null, 2), 'utf-8');
}

function listAllGroups() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => {
      try {
        const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
        return JSON.parse(content);
      } catch (e) { return null; }
    })
    .filter(Boolean);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/cardgroups', (req, res) => {
  const groups = listAllGroups();
  res.json({
    groups: groups.map(g => ({
      id: g.id,
      name: g.name,
      owner: g.owner,
      createDate: g.createDate,
      cardCount: g.cards.length,
      reviewedToday: g.reviewedToday || 0
    }))
  });
});

app.post('/api/cardgroups', (req, res) => {
  const { name, cards, owner } = req.body || {};

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: '卡片组名称不能为空' });
  }
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: '至少添加一张卡片' });
  }
  if (!owner || typeof owner !== 'string') {
    return res.status(400).json({ error: '请先输入昵称' });
  }

  const now = new Date().toISOString();
  const id = uuidv4();

  const groupCards = cards.map(c => ({
    id: uuidv4(),
    front: String(c.front || ''),
    back: String(c.back || ''),
    memoryLevel: 1,
    nextReviewDate: now,
    createDate: now
  }));

  const group = {
    id,
    name: name.trim().slice(0, 50),
    owner: owner.trim().slice(0, 16),
    createDate: now,
    lastReviewDate: null,
    reviewedToday: 0,
    lastReviewDay: null,
    currentIndex: 0,
    cards: groupCards
  };

  writeGroup(group);
  res.status(201).json({ id, group });
});

app.get('/api/cardgroups/:id', (req, res) => {
  const { id } = req.params;
  const group = readGroup(id);
  if (!group) {
    return res.status(404).json({ error: '卡片组不存在' });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (group.lastReviewDay !== today) {
    group.reviewedToday = 0;
    group.lastReviewDay = today;
    writeGroup(group);
  }

  res.json(group);
});

app.put('/api/cards/:id/review', (req, res) => {
  const { id } = req.params;
  const { groupId, feedback } = req.body || {};

  if (!groupId) {
    return res.status(400).json({ error: '缺少卡片组ID' });
  }

  const feedbackNum = Number(feedback);
  if (![1, 2, 3].includes(feedbackNum)) {
    return res.status(400).json({ error: '反馈值无效' });
  }

  const group = readGroup(groupId);
  if (!group) {
    return res.status(404).json({ error: '卡片组不存在' });
  }

  const cardIdx = group.cards.findIndex(c => c.id === id);
  if (cardIdx === -1) {
    return res.status(404).json({ error: '卡片不存在' });
  }

  const card = group.cards[cardIdx];

  if (feedbackNum === 1) {
    card.memoryLevel = 1;
  } else if (feedbackNum === 2) {
    card.memoryLevel = Math.max(1, card.memoryLevel);
  } else if (feedbackNum === 3) {
    card.memoryLevel = Math.min(5, card.memoryLevel + 1);
  }

  const intervalDays = Math.pow(2, card.memoryLevel - 1);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  card.nextReviewDate = nextDate.toISOString();

  group.currentIndex = (group.currentIndex || 0) + 1;
  group.lastReviewDate = new Date().toISOString();

  const today = new Date().toISOString().slice(0, 10);
  if (group.lastReviewDay !== today) {
    group.reviewedToday = 0;
    group.lastReviewDay = today;
  }
  group.reviewedToday = (group.reviewedToday || 0) + 1;

  writeGroup(group);

  res.json({
    card: {
      id: card.id,
      memoryLevel: card.memoryLevel,
      nextReviewDate: card.nextReviewDate
    },
    reviewedToday: group.reviewedToday,
    currentIndex: group.currentIndex
  });
});

app.put('/api/cardgroups/:id/index', (req, res) => {
  const { id } = req.params;
  const { index } = req.body || {};
  const group = readGroup(id);
  if (!group) return res.status(404).json({ error: '卡片组不存在' });
  group.currentIndex = Math.max(0, Number(index) || 0);
  writeGroup(group);
  res.json({ ok: true, currentIndex: group.currentIndex });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✦ MemoryCards Server running on http://localhost:${PORT}`);
  console.log(`  Data directory: ${DATA_DIR}`);
});
