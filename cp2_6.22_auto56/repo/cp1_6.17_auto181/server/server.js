const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let works = [];
let critiques = [];

const sampleUserId = 'user_001';
const sampleUserName = '墨客';

const sampleStrokes = [
  {
    id: 'stroke_1',
    points: [{ x: 100, y: 200, timestamp: Date.now() }],
    color: '#1A1A1A',
    width: 4,
    pathData: 'M 100 200 Q 150 150 200 200 Q 250 250 300 200'
  },
  {
    id: 'stroke_2',
    points: [{ x: 150, y: 280, timestamp: Date.now() }],
    color: '#1A1A1A',
    width: 4,
    pathData: 'M 150 280 L 250 280'
  },
  {
    id: 'stroke_3',
    points: [{ x: 200, y: 350, timestamp: Date.now() }],
    color: '#C23B22',
    width: 4,
    pathData: 'M 200 350 Q 220 400 200 450 Q 180 400 200 350'
  }
];

for (let i = 0; i < 15; i++) {
  works.push({
    id: uuidv4(),
    strokes: sampleStrokes,
    width: 800,
    height: 600,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    userId: sampleUserId,
    isPublic: i % 5 !== 0,
    title: `书法作品 ${i + 1}`
  });
}

works.forEach((work, index) => {
  const critiqueCount = Math.floor(Math.random() * 5) + 1;
  for (let i = 0; i < critiqueCount; i++) {
    critiques.push({
      id: uuidv4(),
      workId: work.id,
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      text: `这是第${i + 1}条批注，点评很到位。`,
      color: ['red', 'yellow', 'blue', 'green'][Math.floor(Math.random() * 4)],
      userId: `user_${Math.floor(Math.random() * 3) + 1}`,
      userName: ['王羲之', '颜真卿', '柳公权'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      replies: []
    });
  }
});

app.get('/api/works', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const userId = req.query.userId;
  
  let filteredWorks = works.filter(w => w.isPublic);
  
  if (userId) {
    filteredWorks = works.filter(w => w.userId === userId);
  }
  
  const startIndex = (page - 1) * limit;
  const paginatedWorks = filteredWorks.slice(startIndex, startIndex + limit);
  
  res.json({
    works: paginatedWorks,
    total: filteredWorks.length,
    page,
    limit,
    hasMore: startIndex + limit < filteredWorks.length
  });
});

app.get('/api/works/:id', (req, res) => {
  const work = works.find(w => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ error: '作品不存在' });
  }
  res.json(work);
});

app.post('/api/works', (req, res) => {
  const { strokes, width, height, userId, isPublic, title } = req.body;
  
  const newWork = {
    id: uuidv4(),
    strokes: strokes || [],
    width: width || 800,
    height: height || 600,
    createdAt: new Date().toISOString(),
    userId: userId || sampleUserId,
    isPublic: isPublic !== undefined ? isPublic : true,
    title: title || '未命名作品'
  };
  
  works.unshift(newWork);
  res.status(201).json(newWork);
});

app.put('/api/works/:id', (req, res) => {
  const index = works.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '作品不存在' });
  }
  
  works[index] = { ...works[index], ...req.body };
  res.json(works[index]);
});

app.get('/api/critiques/:workId', (req, res) => {
  const workCritiques = critiques.filter(c => c.workId === req.params.workId);
  res.json(workCritiques);
});

app.post('/api/critiques', (req, res) => {
  const { workId, x, y, text, color, userId, userName } = req.body;
  
  const newCritique = {
    id: uuidv4(),
    workId,
    x,
    y,
    text,
    color: color || 'red',
    userId: userId || sampleUserId,
    userName: userName || sampleUserName,
    createdAt: new Date().toISOString(),
    replies: []
  };
  
  critiques.push(newCritique);
  res.status(201).json(newCritique);
});

app.post('/api/critiques/reply', (req, res) => {
  const { critiqueId, text, userId, userName, parentId, level } = req.body;
  
  const critique = critiques.find(c => c.id === critiqueId);
  if (!critique) {
    return res.status(404).json({ error: '批注不存在' });
  }
  
  const newReply = {
    id: uuidv4(),
    critiqueId,
    text,
    userId: userId || sampleUserId,
    userName: userName || sampleUserName,
    createdAt: new Date().toISOString(),
    level: Math.min(level || 1, 3),
    parentId: parentId || critiqueId
  };
  
  critique.replies.push(newReply);
  res.status(201).json(newReply);
});

app.listen(PORT, () => {
  console.log(`墨韵纸境后端服务运行在 http://localhost:${PORT}`);
});
