const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

const contentItems = [
  {
    id: 'c1',
    title: '如何提升内容运营效率',
    summary: '本文介绍内容运营中提升效率的5个关键策略，帮助团队快速产出高质量内容。',
    category: '文章',
    materialIds: ['m1', 'm2'],
    platforms: ['微信公众号', '知乎'],
    publishDate: '2026-06-22',
    status: '待发布',
    order: 0,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  },
  {
    id: 'c2',
    title: '夏日饮品推荐短视频',
    summary: '30秒短视频展示3款夏日清凉饮品制作过程，适合抖音和小红书分发。',
    category: '短视频',
    materialIds: ['m3'],
    platforms: ['抖音', '小红书'],
    publishDate: '2026-06-23',
    status: '发布中',
    order: 1,
    createdAt: '2026-06-17T10:30:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
  },
  {
    id: 'c3',
    title: '618大促图文攻略',
    summary: '图文并茂的618购物节攻略，涵盖优惠信息汇总和购物清单推荐。',
    category: '图文',
    materialIds: ['m4', 'm5'],
    platforms: ['微信公众号', '小红书', '微博'],
    publishDate: '2026-06-18',
    status: '已发布',
    order: 2,
    createdAt: '2026-06-15T14:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
  },
  {
    id: 'c4',
    title: '品牌故事系列 - 创始人访谈',
    summary: '深度访谈品牌创始人，讲述创业历程与品牌理念，适合长文平台发布。',
    category: '文章',
    materialIds: ['m5'],
    platforms: ['知乎', '微信公众号'],
    publishDate: '2026-06-25',
    status: '待发布',
    order: 3,
    createdAt: '2026-06-19T16:00:00.000Z',
    updatedAt: '2026-06-19T16:00:00.000Z',
  },
];

const materials = [
  {
    id: 'm1',
    name: 'content-efficiency-cover.jpg',
    type: 'image',
    url: '/uploads/placeholder-cover-1.jpg',
    thumbnailUrl: '/uploads/placeholder-cover-1-thumb.jpg',
    size: 245760,
    linkedContentIds: ['c1'],
    createdAt: '2026-06-18T07:50:00.000Z',
  },
  {
    id: 'm2',
    name: 'efficiency-chart.png',
    type: 'image',
    url: '/uploads/placeholder-chart.png',
    thumbnailUrl: '/uploads/placeholder-chart-thumb.png',
    size: 128000,
    linkedContentIds: ['c1'],
    createdAt: '2026-06-18T07:55:00.000Z',
  },
  {
    id: 'm3',
    name: 'summer-drinks-clip.mp4',
    type: 'video',
    url: '/uploads/placeholder-drinks.mp4',
    thumbnailUrl: '/uploads/placeholder-drinks-thumb.jpg',
    size: 5242880,
    linkedContentIds: ['c2'],
    createdAt: '2026-06-17T10:00:00.000Z',
  },
  {
    id: 'm4',
    name: '618-banner.jpg',
    type: 'image',
    url: '/uploads/placeholder-618-banner.jpg',
    thumbnailUrl: '/uploads/placeholder-618-banner-thumb.jpg',
    size: 327680,
    linkedContentIds: ['c3'],
    createdAt: '2026-06-15T13:00:00.000Z',
  },
  {
    id: 'm5',
    name: 'brand-story-photo.jpg',
    type: 'image',
    url: '/uploads/placeholder-brand-photo.jpg',
    thumbnailUrl: '/uploads/placeholder-brand-photo-thumb.jpg',
    size: 512000,
    linkedContentIds: ['c3', 'c4'],
    createdAt: '2026-06-19T15:30:00.000Z',
  },
];

function isContent(req) {
  return req.baseUrl === '/api/content';
}

router.get('/', (req, res) => {
  if (isContent(req)) {
    const sorted = [...contentItems].sort((a, b) => a.order - b.order);
    return res.json(sorted);
  }
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const start = (page - 1) * limit;
  const items = materials.slice(start, start + limit);
  res.json({ items, total: materials.length });
});

router.post('/', (req, res) => {
  if (isContent(req)) {
    const { title, summary, category, materialIds, platforms, publishDate } = req.body;
    const now = new Date().toISOString();
    const item = {
      id: uuidv4(),
      title: title || '',
      summary: summary || '',
      category: category || '文章',
      materialIds: materialIds || [],
      platforms: platforms || [],
      publishDate: publishDate || '',
      status: '待发布',
      order: contentItems.length,
      createdAt: now,
      updatedAt: now,
    };
    contentItems.push(item);
    return res.status(201).json(item);
  }
  res.status(400).json({ error: 'Use POST /upload for materials' });
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { type } = req.body;
  const now = new Date().toISOString();
  const material = {
    id: uuidv4(),
    name: req.file.originalname,
    type: type || 'image',
    url: `/uploads/${req.file.filename}`,
    thumbnailUrl: `/uploads/${req.file.filename}`,
    size: req.file.size,
    linkedContentIds: [],
    createdAt: now,
  };
  materials.push(material);
  res.status(201).json(material);
});

router.put('/reorder', (req, res) => {
  if (!isContent(req)) return res.status(404).json({ error: 'Not found' });
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });
  for (let i = 0; i < orderedIds.length; i++) {
    const item = contentItems.find((c) => c.id === orderedIds[i]);
    if (item) item.order = i;
  }
  res.json({ success: true });
});

router.put('/:id/status', (req, res) => {
  if (!isContent(req)) return res.status(404).json({ error: 'Not found' });
  const { id } = req.params;
  const { status } = req.body;
  const idx = contentItems.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Content not found' });
  contentItems[idx].status = status;
  contentItems[idx].updatedAt = new Date().toISOString();
  res.json(contentItems[idx]);
});

router.post('/:id/link', (req, res) => {
  if (isContent(req)) return res.status(404).json({ error: 'Not found' });
  const { id } = req.params;
  const { contentId } = req.body;
  const material = materials.find((m) => m.id === id);
  if (!material) return res.status(404).json({ error: 'Material not found' });
  const content = contentItems.find((c) => c.id === contentId);
  if (!content) return res.status(404).json({ error: 'Content not found' });
  if (!material.linkedContentIds.includes(contentId)) {
    material.linkedContentIds.push(contentId);
  }
  if (!content.materialIds.includes(id)) {
    content.materialIds.push(id);
    content.updatedAt = new Date().toISOString();
  }
  res.json({ success: true, material, content });
});

router.put('/:id', (req, res) => {
  if (!isContent(req)) return res.status(404).json({ error: 'Not found' });
  const { id } = req.params;
  const idx = contentItems.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Content not found' });
  const updatable = ['title', 'summary', 'category', 'materialIds', 'platforms', 'publishDate', 'status'];
  for (const key of updatable) {
    if (req.body[key] !== undefined) {
      contentItems[idx][key] = req.body[key];
    }
  }
  contentItems[idx].updatedAt = new Date().toISOString();
  res.json(contentItems[idx]);
});

router.delete('/:id', (req, res) => {
  if (isContent(req)) {
    const { id } = req.params;
    const idx = contentItems.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Content not found' });
    contentItems.splice(idx, 1);
    return res.json({ success: true });
  }
  const { id } = req.params;
  const idx = materials.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Material not found' });
  let linkedContent = 0;
  for (const item of contentItems) {
    if (item.materialIds.includes(id)) {
      item.materialIds = item.materialIds.filter((mid) => mid !== id);
      linkedContent++;
    }
  }
  materials.splice(idx, 1);
  res.json({ success: true, linkedContent });
});

module.exports = router;
module.exports._contentItems = contentItems;
module.exports._materials = materials;
