import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Activity {
  id: string;
  date: string;
  city: string;
  summary: string;
  imageUrl: string;
  order: number;
}

interface SlideData {
  city: string;
  gradientStart: string;
  gradientEnd: string;
  highlights: string[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const activities: Activity[] = [
  {
    id: uuidv4(),
    date: '2026-07-01',
    city: '北京',
    summary: '抵达首都国际机场，入住王府井酒店，傍晚漫步天安门广场',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
    order: 0,
  },
  {
    id: uuidv4(),
    date: '2026-07-02',
    city: '北京',
    summary: '清晨攀登八达岭长城，下午参观故宫博物院',
    imageUrl: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=400',
    order: 1,
  },
  {
    id: uuidv4(),
    date: '2026-07-04',
    city: '上海',
    summary: '乘坐高铁抵达上海，外滩夜景美不胜收，品尝本帮菜',
    imageUrl: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=400',
    order: 2,
  },
  {
    id: uuidv4(),
    date: '2026-07-05',
    city: '上海',
    summary: '登东方明珠俯瞰全景，下午田子坊文艺漫步',
    imageUrl: 'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=400',
    order: 3,
  },
  {
    id: uuidv4(),
    date: '2026-07-07',
    city: '成都',
    summary: '飞抵成都，宽窄巷子体验市井文化，火锅盛宴',
    imageUrl: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400',
    order: 4,
  },
];

const cityGradients: Record<string, { start: string; end: string }> = {
  '北京': { start: '#E53935', end: '#FF8A80' },
  '上海': { start: '#1E88E5', end: '#64B5F6' },
  '成都': { start: '#43A047', end: '#81C784' },
  '广州': { start: '#FB8C00', end: '#FFB74D' },
  '杭州': { start: '#8E24AA', end: '#CE93D8' },
  '西安': { start: '#6D4C41', end: '#BCAAA4' },
  '重庆': { start: '#00897B', end: '#4DB6AC' },
  '厦门': { start: '#00ACC1', end: '#4DD0E1' },
  '深圳': { start: '#3949AB', end: '#7986CB' },
  '南京': { start: '#7B1FA2', end: '#BA68C8' },
};

const defaultGradients = [
  { start: '#FF7043', end: '#FFAB91' },
  { start: '#42A5F5', end: '#90CAF9' },
  { start: '#66BB6A', end: '#A5D6A7' },
  { start: '#FFA726', end: '#FFCC80' },
  { start: '#AB47BC', end: '#CE93D8' },
];

function getGradientForCity(city: string, index: number) {
  if (cityGradients[city]) return cityGradients[city];
  return defaultGradients[index % defaultGradients.length];
}

function generateHighlights(activities: Activity[], city: string): string[] {
  const cityActivities = activities.filter(a => a.city === city);
  const allSummaries = cityActivities.map(a => a.summary);
  const highlights: string[] = [];
  const pool = [
    `探索了${city}的经典地标`,
    `品尝了当地特色美食`,
    `漫步于历史文化街区`,
    `记录了珍贵的旅途瞬间`,
    `感受了独特的城市氛围`,
    `与当地人深度交流`,
    `参观了博物馆与艺术展`,
    `体验了城市夜生活`,
  ];
  for (let i = 0; i < 3; i++) {
    if (i < allSummaries.length) {
      const s = allSummaries[i];
      highlights.push(s.length > 30 ? s.slice(0, 30) + '...' : s);
    } else {
      highlights.push(pool[(i + city.length) % pool.length]);
    }
  }
  return highlights;
}

app.get('/api/activities', (_req, res) => {
  const sorted = [...activities].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

app.post('/api/activities', (req, res) => {
  const { date, city, summary, imageUrl } = req.body;
  if (!date || !city || !summary) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const newActivity: Activity = {
    id: uuidv4(),
    date,
    city,
    summary,
    imageUrl: imageUrl || `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(city)}`,
    order: activities.length,
  };
  activities.push(newActivity);
  res.status(201).json(newActivity);
});

app.put('/api/activities', (req, res) => {
  const updates: { id: string; order: number }[] = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: '请求必须是数组' });
  }
  updates.forEach(({ id, order }) => {
    const item = activities.find(a => a.id === id);
    if (item) item.order = order;
  });
  res.json({ success: true });
});

app.delete('/api/activities/:id', (req, res) => {
  const idx = activities.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '未找到记录' });
  }
  activities.splice(idx, 1);
  activities.forEach((a, i) => (a.order = i));
  res.json({ success: true });
});

app.get('/api/trips/generate', (_req, res) => {
  const sorted = [...activities].sort((a, b) => a.order - b.order);
  const citySet = new Set<string>();
  const cityOrder: string[] = [];
  sorted.forEach(a => {
    if (!citySet.has(a.city)) {
      citySet.add(a.city);
      cityOrder.push(a.city);
    }
  });
  const slides: SlideData[] = cityOrder.map((city, idx) => {
    const { start, end } = getGradientForCity(city, idx);
    return {
      city,
      gradientStart: start,
      gradientEnd: end,
      highlights: generateHighlights(sorted, city),
    };
  });
  res.json(slides);
});

app.listen(PORT, () => {
  console.log(`旅行足迹后端运行在 http://localhost:${PORT}`);
});
