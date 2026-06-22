import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ORIGINS = [
  '埃塞俄比亚', '哥伦比亚', '巴西', '肯尼亚', '危地马拉',
  '哥斯达黎加', '巴拿马', '印尼', '卢旺达', '中国云南'
];

const FLAVOR_LABELS = ['酸度', '甜度', '苦度', '醇厚度', '干净度', '余韵'];

const generateMockData = () => {
  const records = [];
  const beanNames = ['耶加雪菲', '瑰夏', '曼特宁', '蓝山', '西达摩', '瑰夏村', '科契尔', '花月夜'];
  const roastLevels = ['浅', '中', '深'];

  for (let i = 0; i < 60; i++) {
    const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
    const roastLevel = roastLevels[Math.floor(Math.random() * roastLevels.length)];
    const grindSize = Math.floor(Math.random() * 10) + 1;
    const waterTemp = 80 + Math.random() * 20;
    const ratio = 12 + Math.floor(Math.random() * 8);
    const powderWeight = 15;
    const waterWeight = powderWeight * ratio;
    const pourStages = [];
    const stageCount = Math.floor(Math.random() * 3) + 2;
    let remainingWater = waterWeight;
    for (let s = 0; s < stageCount; s++) {
      const isLast = s === stageCount - 1;
      const stageWater = isLast ? remainingWater : Math.floor(waterWeight / stageCount);
      const stageTime = 15 + Math.floor(Math.random() * 30);
      pourStages.push({ water: stageWater, time: stageTime });
      remainingWater -= stageWater;
    }
    const extractionRate = 16 + Math.random() * 8;
    const flavor = FLAVOR_LABELS.reduce((acc, label) => {
      acc[label] = Math.floor(Math.random() * 10) + 1;
      return acc;
    }, {});
    const likes = Math.floor(Math.random() * 100);
    const comments = [];
    const commentCount = Math.floor(Math.random() * 5);
    for (let c = 0; c < commentCount; c++) {
      comments.push({
        id: uuidv4(),
        user: `咖啡爱好者${c + 1}`,
        text: ['很棒的配方！', '下次试试', '风味描述很详细', '冲煮参数很专业'][Math.floor(Math.random() * 4)],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    records.push({
      id: uuidv4(),
      beanName: beanNames[Math.floor(Math.random() * beanNames.length)] + ' ' + (i + 1),
      origin,
      roastLevel,
      grindSize,
      waterTemp: parseFloat(waterTemp.toFixed(1)),
      powderWeight,
      waterWeight,
      ratio: `1:${ratio}`,
      pourStages,
      extractionRate: parseFloat(extractionRate.toFixed(2)),
      flavor,
      likes,
      likedByMe: Math.random() > 0.7,
      comments,
      isPublished: Math.random() > 0.2,
      userId: Math.random() > 0.4 ? 'user1' : 'user2',
      createdAt: date.toISOString(),
    });
  }
  return records;
};

let brewingRecords = generateMockData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/origins', (req, res) => {
  res.json(ORIGINS);
});

app.get('/api/records', (req, res) => {
  const { page = 1, limit = 20, userId } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  let filtered = [...brewingRecords];
  if (userId) {
    filtered = filtered.filter(r => r.userId === userId);
  }
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const records = filtered.slice(start, end);
  res.json({
    records,
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    hasMore: end < filtered.length,
  });
});

app.get('/api/community', (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    origin = '',
    roastLevel = '',
    flavor = '',
  } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  let filtered = brewingRecords.filter(r => r.isPublished);

  if (search) {
    const searchStr = String(search).toLowerCase();
    filtered = filtered.filter(r =>
      r.beanName.toLowerCase().includes(searchStr) ||
      r.origin.toLowerCase().includes(searchStr)
    );
  }
  if (origin) {
    filtered = filtered.filter(r => r.origin === origin);
  }
  if (roastLevel) {
    filtered = filtered.filter(r => r.roastLevel === roastLevel);
  }
  if (flavor) {
    const flavorKeys = String(flavor).split(',').filter(Boolean);
    filtered = filtered.filter(r =>
      flavorKeys.some(key => (r.flavor[key] || 0) >= 7)
    );
  }

  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const records = filtered.slice(start, end);
  res.json({
    records,
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    hasMore: end < filtered.length,
  });
});

app.get('/api/records/:id', (req, res) => {
  const record = brewingRecords.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(record);
});

app.post('/api/records', (req, res) => {
  const newRecord = {
    id: uuidv4(),
    ...req.body,
    likes: 0,
    likedByMe: false,
    comments: [],
    userId: 'user1',
    createdAt: new Date().toISOString(),
  };
  brewingRecords.unshift(newRecord);
  res.status(201).json(newRecord);
});

app.put('/api/records/:id', (req, res) => {
  const idx = brewingRecords.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  brewingRecords[idx] = { ...brewingRecords[idx], ...req.body };
  res.json(brewingRecords[idx]);
});

app.delete('/api/records/:id', (req, res) => {
  const idx = brewingRecords.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const deleted = brewingRecords.splice(idx, 1);
  res.json(deleted[0]);
});

app.post('/api/records/:id/like', (req, res) => {
  const record = brewingRecords.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  record.likedByMe = !record.likedByMe;
  record.likes += record.likedByMe ? 1 : -1;
  res.json({ likes: record.likes, likedByMe: record.likedByMe });
});

app.post('/api/records/:id/comments', (req, res) => {
  const record = brewingRecords.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const newComment = {
    id: uuidv4(),
    user: '我',
    text: req.body.text,
    createdAt: new Date().toISOString(),
  };
  record.comments.push(newComment);
  res.status(201).json(newComment);
});

app.get('/api/stats', (req, res) => {
  const { userId = 'user1', days = 30 } = req.query;
  const daysNum = parseInt(days);
  const now = new Date();
  const startDate = new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000);

  const userRecords = brewingRecords.filter(r =>
    r.userId === userId && new Date(r.createdAt) >= startDate
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const extractionTrend = [];
  const dateMap = {};
  userRecords.forEach(r => {
    const dateStr = r.createdAt.split('T')[0];
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = { sum: 0, count: 0 };
    }
    dateMap[dateStr].sum += r.extractionRate;
    dateMap[dateStr].count += 1;
  });
  Object.keys(dateMap).sort().forEach(date => {
    extractionTrend.push({
      date,
      萃取率: parseFloat((dateMap[date].sum / dateMap[date].count).toFixed(2)),
    });
  });

  const flavorDist = FLAVOR_LABELS.map(label => {
    const total = userRecords.reduce((sum, r) => sum + (r.flavor[label] || 0), 0);
    return {
      flavor: label,
      平均: userRecords.length > 0 ? parseFloat((total / userRecords.length).toFixed(2)) : 0,
    };
  });

  const avgExtraction = userRecords.length > 0
    ? parseFloat((userRecords.reduce((sum, r) => sum + r.extractionRate, 0) / userRecords.length).toFixed(2))
    : 0;

  const roastCount = { 浅: 0, 中: 0, 深: 0 };
  userRecords.forEach(r => { roastCount[r.roastLevel] = (roastCount[r.roastLevel] || 0) + 1; });

  res.json({
    totalRecords: userRecords.length,
    avgExtraction,
    extractionTrend,
    flavorDist,
    roastCount,
  });
});

app.listen(PORT, () => {
  console.log(`Coffee Brewing API server running on http://localhost:${PORT}`);
});
