const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'data', 'entries.json');

const USERS = {
  'user-1': { id: 'user-1', name: '张三', color: '#EF4444' },
  'user-2': { id: 'user-2', name: '李四', color: '#3B82F6' },
  'user-3': { id: 'user-3', name: '王五', color: '#22C55E' }
};

function readEntries() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

function getWeekDates(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  return { start: ISOweekStart.getTime(), end: ISOweekEnd.getTime() };
}

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

router.get('/', (req, res) => {
  try {
    const { week } = req.query;
    const entries = readEntries();

    if (week) {
      const [yearStr, weekStr] = String(week).split('-');
      const year = parseInt(yearStr, 10);
      const weekNum = parseInt(weekStr, 10);

      if (isNaN(year) || isNaN(weekNum)) {
        return res.status(400).json({ error: 'Invalid week format, use YYYY-WW' });
      }

      const { start, end } = getWeekDates(year, weekNum);
      const weekEntries = entries
        .filter(e => e.timestamp >= start && e.timestamp <= end)
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(e => ({
          ...e,
          user: USERS[e.userId] || { id: e.userId, name: '未知用户', color: '#999999' },
          relativeTime: formatRelativeTime(e.timestamp)
        }));

      const contributorIds = [...new Set(weekEntries.map(e => e.userId))];

      return res.json({
        week: `${year}-${String(weekNum).padStart(2, '0')}`,
        weekLabel: `${year}年第${weekNum}周`,
        totalEntries: weekEntries.length,
        contributorCount: contributorIds.length,
        lastEditTime: weekEntries.length > 0 ? weekEntries[0].timestamp : null,
        contributors: contributorIds.map(id => USERS[id] || { id, name: '未知用户', color: '#999999' }),
        entries: weekEntries
      });
    }

    const weeksMap = new Map();
    entries.forEach(entry => {
      const { year, week } = getWeekNumber(new Date(entry.timestamp));
      const key = `${year}-${String(week).padStart(2, '0')}`;
      if (!weeksMap.has(key)) {
        weeksMap.set(key, {
          week: key,
          weekLabel: `${year}年第${week}周`,
          entries: [],
          contributorIds: new Set()
        });
      }
      const weekData = weeksMap.get(key);
      weekData.entries.push(entry);
      weekData.contributorIds.add(entry.userId);
    });

    const weeks = Array.from(weeksMap.values())
      .map(w => ({
        week: w.week,
        weekLabel: w.weekLabel,
        totalEntries: w.entries.length,
        contributorCount: w.contributorIds.size,
        lastEditTime: w.entries.reduce((max, e) => Math.max(max, e.timestamp), 0),
        contributors: Array.from(w.contributorIds).map(id => USERS[id] || { id, name: '未知用户', color: '#999999' })
      }))
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 4);

    res.json(weeks);
  } catch (err) {
    console.error('Error fetching archives:', err);
    res.status(500).json({ error: 'Failed to fetch archives' });
  }
});

module.exports = router;
