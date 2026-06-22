import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { MaterialMeta, SearchParams } from '../src/types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const metadataStore: MaterialMeta[] = [];

function generateMockData() {
  const scenes = ['办公室', '街道夜景', '咖啡馆', '公园', '家庭客厅', '会议室', '医院走廊', '学校操场'];
  const actors = ['张明', '李华', '王芳', '赵强', '刘洋', '陈静', '周杰', '吴磊'];
  const lightings = ['自然光', '三点布光', '高对比度', '柔光', '逆光', '顶光', '环境光'];
  const titles = [
    '开场远景', '人物特写', '对话中景', '转场空镜', '情绪镜头',
    '动作场景', '回忆片段', '主观视角', '俯拍全景', '跟踪镜头'
  ];

  for (let i = 0; i < 50; i++) {
    const now = Date.now() - i * 86400000;
    metadataStore.push({
      id: uuidv4(),
      title: `${titles[i % titles.length]} ${Math.floor(i / 10) + 1}`,
      scene: scenes[i % scenes.length],
      actor: actors[i % actors.length],
      lighting: lightings[i % lightings.length],
      thumbnailUrl: '',
      duration: Math.floor(Math.random() * 120) + 5,
      createTime: new Date(now).toISOString()
    });
  }
}

generateMockData();

app.get('/api/metadata', (req, res) => {
  const {
    keyword = '',
    field = '',
    fieldValue = '',
    page = 1,
    pageSize = 100,
    sortField = 'createTime',
    sortOrder = 'desc'
  } = req.query as unknown as SearchParams;

  let filtered = [...metadataStore];

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(kw) ||
      item.scene.toLowerCase().includes(kw) ||
      item.actor.toLowerCase().includes(kw)
    );
  }

  if (field && fieldValue) {
    filtered = filtered.filter(item => {
      const value = (item as unknown as Record<string, unknown>)[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(fieldValue.toLowerCase());
      }
      return false;
    });
  }

  if (sortField) {
    filtered.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField];
      const bVal = (b as unknown as Record<string, unknown>)[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  const total = filtered.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const list = filtered.slice(start, start + Number(pageSize));

  res.json({ list, total });
});

app.get('/api/metadata/fields/:fieldName', (req, res) => {
  const { fieldName } = req.params;
  const validFields = ['scene', 'actor', 'lighting', 'title'];

  if (!validFields.includes(fieldName)) {
    res.status(400).json({ error: 'Invalid field name' });
    return;
  }

  const values = Array.from(
    new Set(
      metadataStore
        .map(item => (item as unknown as Record<string, string>)[fieldName])
        .filter(Boolean)
    )
  ).sort();

  res.json(values);
});

app.post('/api/metadata', (req, res) => {
  const { title, scene, actor, lighting, thumbnailUrl, duration } = req.body;

  if (!title || title.length > 50) {
    res.status(400).json({ error: '标题必填且不超过50字' });
    return;
  }
  if (typeof duration !== 'number' || duration <= 0) {
    res.status(400).json({ error: '时长必须为正数' });
    return;
  }
  if (thumbnailUrl && thumbnailUrl.length > 700000) {
    res.status(400).json({ error: '缩略图大小不能超过500KB' });
    return;
  }

  const newItem: MaterialMeta = {
    id: uuidv4(),
    title,
    scene: scene || '',
    actor: actor || '',
    lighting: lighting || '',
    thumbnailUrl: thumbnailUrl || '',
    duration,
    createTime: new Date().toISOString()
  };

  metadataStore.unshift(newItem);
  res.status(201).json(newItem);
});

app.delete('/api/metadata/:id', (req, res) => {
  const { id } = req.params;
  const index = metadataStore.findIndex(item => item.id === id);

  if (index === -1) {
    res.status(404).json({ error: '未找到该记录' });
    return;
  }

  metadataStore.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
