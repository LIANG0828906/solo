import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { MoodEntry, FilterOptions, StatResult, CorrelationResult } from '../types';
import { calculateCorrelation, calculateStats } from './correlationEngine';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const moodData: MoodEntry[] = [
  {
    id: uuidv4(),
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 'happy',
    intensity: 8,
    sleepHours: 7.5,
    exerciseMinutes: 45,
    waterCups: 8,
    dietLabels: ['healthy', 'light'],
  },
  {
    id: uuidv4(),
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 'calm',
    intensity: 6,
    sleepHours: 6.5,
    exerciseMinutes: 30,
    waterCups: 6,
    dietLabels: ['healthy'],
  },
  {
    id: uuidv4(),
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 'anxious',
    intensity: 4,
    sleepHours: 5,
    exerciseMinutes: 0,
    waterCups: 4,
    dietLabels: ['high_sugar', 'high_salt'],
  },
  {
    id: uuidv4(),
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 'sad',
    intensity: 3,
    sleepHours: 5.5,
    exerciseMinutes: 15,
    waterCups: 5,
    dietLabels: ['high_sugar'],
  },
  {
    id: uuidv4(),
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 'calm',
    intensity: 7,
    sleepHours: 7,
    exerciseMinutes: 40,
    waterCups: 7,
    dietLabels: ['healthy', 'light'],
  },
  {
    id: uuidv4(),
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mood: 'happy',
    intensity: 9,
    sleepHours: 8,
    exerciseMinutes: 60,
    waterCups: 9,
    dietLabels: ['healthy'],
  },
  {
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    mood: 'happy',
    intensity: 7,
    sleepHours: 7,
    exerciseMinutes: 35,
    waterCups: 6,
    dietLabels: ['light'],
  },
];

function filterMoods(moods: MoodEntry[], filters: FilterOptions): MoodEntry[] {
  return moods.filter((mood) => {
    if (filters.exerciseMoreThan30 && mood.exerciseMinutes <= 30) return false;
    if (filters.sleepLessThan6 && mood.sleepHours >= 6) return false;
    if (filters.highSugar && !mood.dietLabels.includes('high_sugar')) return false;
    if (filters.highSalt && !mood.dietLabels.includes('high_salt')) return false;
    if (filters.healthyDiet && !mood.dietLabels.includes('healthy')) return false;
    if (filters.lightDiet && !mood.dietLabels.includes('light')) return false;
    if (filters.spicyDiet && !mood.dietLabels.includes('spicy')) return false;
    return true;
  });
}

app.get('/api/moods', (req, res) => {
  let filters: FilterOptions = {};
  if (req.query.filters) {
    try {
      filters = JSON.parse(req.query.filters as string);
    } catch {
      filters = {};
    }
  }

  let days = 7;
  if (req.query.days) {
    days = parseInt(req.query.days as string, 10) || 7;
  }

  const sorted = [...moodData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recent = sorted.slice(0, days);
  const filtered = filterMoods(recent, filters);

  const overallStats = calculateStats(recent);
  const filteredStats = calculateStats(filtered);

  const result: { moods: MoodEntry[]; stats: StatResult } = {
    moods: filtered,
    stats: {
      filteredAvg: filteredStats.avg,
      filteredStd: filteredStats.std,
      overallAvg: overallStats.avg,
      overallStd: overallStats.std,
      filteredCount: filtered.length,
      totalCount: recent.length,
    },
  };

  res.json(result);
});

app.post('/api/moods', (req, res) => {
  const body = req.body as Partial<MoodEntry>;

  if (!body.mood || !body.intensity) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const today = new Date().toISOString().split('T')[0];
  const existingIndex = moodData.findIndex((m) => m.date === today);

  const entry: MoodEntry = {
    id: existingIndex >= 0 ? moodData[existingIndex].id : uuidv4(),
    date: today,
    mood: body.mood,
    intensity: body.intensity,
    sleepHours: body.sleepHours ?? 0,
    exerciseMinutes: body.exerciseMinutes ?? 0,
    waterCups: body.waterCups ?? 0,
    dietLabels: body.dietLabels ?? [],
  };

  if (existingIndex >= 0) {
    moodData[existingIndex] = entry;
  } else {
    moodData.push(entry);
  }

  res.status(201).json(entry);
});

app.get('/api/analysis/correlation', (req, res) => {
  let days = 30;
  if (req.query.days) {
    days = parseInt(req.query.days as string, 10) || 30;
  }

  const sorted = [...moodData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recent = sorted.slice(0, days);

  const result: { correlation: CorrelationResult; count: number } = {
    correlation: calculateCorrelation(recent),
    count: recent.length,
  };

  res.json(result);
});

app.get('/api/export', (req, res) => {
  let days = 30;
  if (req.query.days) {
    days = parseInt(req.query.days as string, 10) || 30;
  }

  const sorted = [...moodData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recent = sorted.slice(0, days);
  const correlation = calculateCorrelation(recent);

  const headers = ['日期', '情绪', '强度', '睡眠时长(小时)', '运动时长(分钟)', '饮水杯数', '饮食标签'];
  const rows = recent.map((m) => [
    m.date,
    m.mood,
    m.intensity.toString(),
    m.sleepHours.toString(),
    m.exerciseMinutes.toString(),
    m.waterCups.toString(),
    m.dietLabels.join(';'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '',
    '关联分析 (Pearson相关系数)',
    `睡眠时长,${correlation.sleepHours}`,
    `运动时长,${correlation.exerciseMinutes}`,
    `饮水量,${correlation.waterCups}`,
  ].join('\n');

  const startDate = recent.length > 0 ? recent[recent.length - 1].date : 'N/A';
  const endDate = recent.length > 0 ? recent[0].date : 'N/A';
  const filename = `情绪报告_${startDate}_${endDate}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csvContent);
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
