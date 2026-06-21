const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const scheduleEntries = [
  {
    id: 's1',
    contentId: 'c1',
    date: '2026-06-22',
    platforms: ['微信公众号', '知乎'],
    status: '待发布',
  },
  {
    id: 's2',
    contentId: 'c2',
    date: '2026-06-23',
    platforms: ['抖音', '小红书'],
    status: '待发布',
  },
  {
    id: 's3',
    contentId: 'c3',
    date: '2026-06-18',
    platforms: ['微信公众号', '小红书', '微博'],
    status: '已发布',
  },
  {
    id: 's4',
    contentId: 'c4',
    date: '2026-06-25',
    platforms: ['知乎', '微信公众号'],
    status: '待发布',
  },
];

const syncLogs = [
  {
    id: 'log1',
    contentId: 'c3',
    platform: '微信公众号',
    publishTime: '2026-06-18T12:01:00.000Z',
    status: '成功',
  },
  {
    id: 'log2',
    contentId: 'c3',
    platform: '小红书',
    publishTime: '2026-06-18T12:01:30.000Z',
    status: '成功',
  },
  {
    id: 'log3',
    contentId: 'c3',
    platform: '微博',
    publishTime: '2026-06-18T12:02:00.000Z',
    status: '失败',
    errorMessage: '微博接口超时，请稍后重试',
  },
];

router.get('/:year/:month', (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const items = scheduleEntries.filter((e) => e.date === dateStr);
    days.push({ date: dateStr, items, count: items.length });
  }
  res.json(days);
});

router.post('/schedule', (req, res) => {
  const { contentId, date, platforms } = req.body;
  if (!contentId || !date || !platforms) {
    return res.status(400).json({ error: 'contentId, date, and platforms are required' });
  }
  const entry = {
    id: uuidv4(),
    contentId,
    date,
    platforms: platforms || [],
    status: '待发布',
  };
  scheduleEntries.push(entry);
  res.status(201).json(entry);
});

router.put('/schedule/:id', (req, res) => {
  const { id } = req.params;
  const idx = scheduleEntries.findIndex((e) => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Schedule entry not found' });
  if (req.body.date !== undefined) scheduleEntries[idx].date = req.body.date;
  if (req.body.platforms !== undefined) scheduleEntries[idx].platforms = req.body.platforms;
  if (req.body.status !== undefined) scheduleEntries[idx].status = req.body.status;
  res.json(scheduleEntries[idx]);
});

router.get('/logs', (req, res) => {
  let logs = [...syncLogs].sort(
    (a, b) => new Date(b.publishTime) - new Date(a.publishTime)
  );
  if (req.query.contentId) {
    logs = logs.filter((l) => l.contentId === req.query.contentId);
  }
  res.json(logs);
});

router.post('/simulate-publish/:id', async (req, res) => {
  const { id } = req.params;

  const contentItems = require('./contentRoutes')._contentItems;
  const content = contentItems.find((c) => c.id === id);
  if (!content) return res.status(404).json({ error: 'Content not found' });

  content.status = '发布中';
  content.updatedAt = new Date().toISOString();

  const platforms = content.platforms;
  const createdLogs = [];

  for (const platform of platforms) {
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
    const succeeded = Math.random() > 0.3;
    const log = {
      id: uuidv4(),
      contentId: id,
      platform,
      publishTime: new Date().toISOString(),
      status: succeeded ? '成功' : '失败',
    };
    if (!succeeded) {
      log.errorMessage = `发布至${platform}失败，请检查账号权限或网络后重试`;
    }
    syncLogs.push(log);
    createdLogs.push(log);
  }

  const allSuccess = createdLogs.every((l) => l.status === '成功');
  content.status = allSuccess ? '已发布' : '失败';
  content.updatedAt = new Date().toISOString();

  const scheduleEntry = scheduleEntries.find((e) => e.contentId === id);
  if (scheduleEntry) {
    scheduleEntry.status = allSuccess ? '已发布' : '失败';
  }

  res.json(createdLogs);
});

module.exports = router;
module.exports._scheduleEntries = scheduleEntries;
module.exports._syncLogs = syncLogs;
