import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Draft, ScheduledItem } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let drafts: Draft[] = [
  {
    id: uuidv4(),
    title: '夏日穿搭分享',
    body: '今天分享一组清爽夏日穿搭，适合通勤和约会',
    imageUrl: '',
    platform: '小红书',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: uuidv4(),
    title: '产品评测：新款耳机',
    body: '深度评测新款降噪耳机，音质续航双在线',
    imageUrl: '',
    platform: '微博',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

let schedule: ScheduledItem[] = [];

const platformBestTimes: Record<string, string[]> = {
  '微博': ['12:00-14:00', '20:00-22:00'],
  '小红书': ['14:00-16:00', '21:00-23:00'],
  '抖音': ['18:00-20:00', '21:00-23:00'],
  '微信公众号': ['08:00-09:00', '20:00-21:00']
};

app.get('/api/drafts', (_req, res) => {
  const scheduledDraftIds = new Set(schedule.map(s => s.draftId));
  const unscheduled = drafts.filter(d => !scheduledDraftIds.has(d.id));
  const sorted = unscheduled.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

app.post('/api/drafts', (req, res) => {
  const { title, body, imageUrl, platform } = req.body;
  if (!title || !body || !platform) {
    return res.status(400).json({ error: '标题、正文和平台为必填项' });
  }
  const newDraft: Draft = {
    id: uuidv4(),
    title,
    body,
    imageUrl: imageUrl || '',
    platform,
    createdAt: new Date().toISOString()
  };
  drafts.unshift(newDraft);
  res.status(201).json(newDraft);
});

app.put('/api/drafts/:id', (req, res) => {
  const { id } = req.params;
  const idx = drafts.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '草稿不存在' });
  }
  drafts[idx] = { ...drafts[idx], ...req.body };
  res.json(drafts[idx]);
});

app.delete('/api/drafts/:id', (req, res) => {
  const { id } = req.params;
  drafts = drafts.filter(d => d.id !== id);
  schedule = schedule.filter(s => s.draftId !== id);
  res.json({ success: true });
});

app.post('/api/drafts/batch', (req, res) => {
  const items = req.body as Array<Partial<Draft>>;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '数据格式错误，需要数组' });
  }

  const existingKeys = new Set(drafts.map(d => `${d.title}|${d.platform}`));
  const newDrafts: Draft[] = [];

  for (const item of items) {
    if (!item.title || !item.body || !item.platform) continue;
    const key = `${item.title}|${item.platform}`;
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      newDrafts.push({
        id: uuidv4(),
        title: item.title,
        body: item.body,
        imageUrl: item.imageUrl || '',
        platform: item.platform,
        createdAt: new Date().toISOString()
      });
    }
  }

  drafts = [...newDrafts, ...drafts];
  res.status(201).json({ imported: newDrafts.length, drafts: newDrafts });
});

app.get('/api/schedule', (_req, res) => {
  const result: Record<string, Array<ScheduledItem & { draft: Draft }>> = {};
  for (const s of schedule) {
    if (!result[s.date]) result[s.date] = [];
    const draft = drafts.find(d => d.id === s.draftId);
    if (draft) {
      result[s.date].push({ ...s, draft });
    }
  }
  res.json(result);
});

app.post('/api/schedule', (req, res) => {
  const { draftId, date, timeSlot } = req.body;
  if (!draftId || !date) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const existing = schedule.find(s => s.draftId === draftId);
  if (existing) {
    existing.date = date;
    existing.timeSlot = timeSlot;
    return res.json(existing);
  }

  const newItem: ScheduledItem = {
    id: uuidv4(),
    draftId,
    date,
    timeSlot
  };
  schedule.push(newItem);
  res.status(201).json(newItem);
});

app.delete('/api/schedule/:id', (req, res) => {
  const { id } = req.params;
  schedule = schedule.filter(s => s.id !== id);
  res.json({ success: true });
});

app.get('/api/recommend/:date', (req, res) => {
  const { date } = req.params;
  const dayOfWeek = new Date(date).getDay();
  const recommendations: Record<string, string> = {};

  for (const [platform, slots] of Object.entries(platformBestTimes)) {
    const idx = dayOfWeek % slots.length;
    recommendations[platform] = slots[idx];
  }

  const count = schedule.filter(s => s.date === date).length;
  res.json({
    date,
    count,
    recommendations,
    isOverloaded: count >= 10
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
