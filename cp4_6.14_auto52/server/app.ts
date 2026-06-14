import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

interface Artwork {
  id: string;
  name: string;
  artist: string;
  description: string;
  image: string;
  audioTracks: string[];
  position?: { x: number; y: number; wall: string };
  order?: number;
}

interface Exhibition {
  id: string;
  name: string;
  openingDate: string;
  backgroundColor: string;
  backgroundMode: 'solid' | 'gradient';
  backgroundGradientEnd?: string;
  artworks: Artwork[];
  layout?: { width: number; height: number; hangPoints: any[] };
}

interface Visitor {
  id: string;
  nickname: string;
  startTime: number;
  duration: number;
  completionRate: number;
  artworkStayTimes: Record<string, number>;
}

const exhibitions: Record<string, Exhibition> = {};
const visitors: Record<string, Visitor> = {};
const visitorList: string[] = [];

const sampleArtworks: Artwork[] = [
  {
    id: uuidv4(),
    name: '星空',
    artist: '文森特·梵高',
    description: '《星空》是荷兰后印象派画家文森特·梵高于1889年5月在法国圣雷米的一家精神病院创作的一幅油画。',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
    audioTracks: ['audio1', 'audio2', 'audio3'],
    position: { x: 4, y: 0, wall: 'north' },
    order: 0,
  },
  {
    id: uuidv4(),
    name: '蒙娜丽莎',
    artist: '列奥纳多·达·芬奇',
    description: '《蒙娜丽莎》是意大利文艺复兴时期画家列奥纳多·达·芬奇创作的油画，现收藏于法国卢浮宫博物馆。',
    image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=400&fit=crop',
    audioTracks: ['audio1'],
    position: { x: 8, y: 0, wall: 'north' },
    order: 1,
  },
  {
    id: uuidv4(),
    name: '呐喊',
    artist: '爱德华·蒙克',
    description: '《呐喊》是挪威表现主义画家爱德华·蒙克的代表作之一，创作于1893年。',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
    audioTracks: ['audio1', 'audio2'],
    position: { x: 12, y: 0, wall: 'north' },
    order: 2,
  },
  {
    id: uuidv4(),
    name: '戴珍珠耳环的少女',
    artist: '约翰内斯·维米尔',
    description: '《戴珍珠耳环的少女》是荷兰黄金时代画家约翰内斯·维米尔的代表作，被誉为"北方的蒙娜丽莎"。',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    audioTracks: ['audio1'],
    position: { x: 16, y: 0, wall: 'north' },
    order: 3,
  },
  {
    id: uuidv4(),
    name: '格尔尼卡',
    artist: '巴勃罗·毕加索',
    description: '《格尔尼卡》是西班牙立体主义画家巴勃罗·毕加索于1937年创作的一幅巨型油画。',
    image: 'https://images.unsplash.com/photo-1549289524-06cf8837ace5?w=400&h=400&fit=crop',
    audioTracks: ['audio1', 'audio2', 'audio3'],
    position: { x: 0, y: 4, wall: 'west' },
    order: 4,
  },
];

const defaultExhibitionId = uuidv4();
exhibitions[defaultExhibitionId] = {
  id: defaultExhibitionId,
  name: '现代艺术大师展',
  openingDate: '2024-01-15',
  backgroundColor: '#1e293b',
  backgroundMode: 'solid',
  artworks: sampleArtworks,
  layout: {
    width: 20,
    height: 15,
    hangPoints: [],
  },
};

for (let i = 0; i < 15; i++) {
  const visitorId = uuidv4();
  const nicknames = ['艺术爱好者', '漫游者', '观展人', '收藏家', '学生', '设计师', '摄影师', '诗人', '建筑师', '音乐人'];
  const nickname = nicknames[Math.floor(Math.random() * nicknames.length)] + (i + 1);
  const startTime = Date.now() - Math.random() * 3600000;
  const duration = Math.floor(Math.random() * 1800) + 60;
  const artworkStayTimes: Record<string, number> = {};
  
  sampleArtworks.forEach(art => {
    artworkStayTimes[art.id] = Math.floor(Math.random() * 120) + 10;
  });

  visitors[visitorId] = {
    id: visitorId,
    nickname,
    startTime,
    duration,
    completionRate: Math.floor(Math.random() * 60) + 40,
    artworkStayTimes,
  };
  visitorList.unshift(visitorId);
}

app.get('/api/exhibitions', (req, res) => {
  res.json(Object.values(exhibitions));
});

app.get('/api/exhibitions/:id', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  res.json(exhibition);
});

app.post('/api/exhibitions', (req, res) => {
  const { name, openingDate, backgroundColor, backgroundMode, backgroundGradientEnd } = req.body;
  const id = uuidv4();
  exhibitions[id] = {
    id,
    name,
    openingDate,
    backgroundColor,
    backgroundMode,
    backgroundGradientEnd,
    artworks: [],
    layout: {
      width: 20,
      height: 15,
      hangPoints: [],
    },
  };
  res.status(201).json(exhibitions[id]);
});

app.put('/api/exhibitions/:id', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  Object.assign(exhibition, req.body);
  res.json(exhibition);
});

app.post('/api/exhibitions/:id/artworks', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  const artwork: Artwork = {
    id: uuidv4(),
    ...req.body,
  };
  exhibition.artworks.push(artwork);
  res.status(201).json(artwork);
});

app.put('/api/exhibitions/:id/layout', (req, res) => {
  const exhibition = exhibitions[req.params.id];
  if (!exhibition) {
    return res.status(404).json({ error: '展览不存在' });
  }
  exhibition.layout = req.body;
  exhibition.artworks = req.body.artworks || exhibition.artworks;
  res.json(exhibition);
});

app.get('/api/visitors', (req, res) => {
  const recentVisitors = visitorList.slice(0, 10).map(id => visitors[id]);
  
  const artworkStats: Record<string, number> = {};
  Object.values(visitors).forEach(visitor => {
    Object.entries(visitor.artworkStayTimes).forEach(([artworkId, time]) => {
      artworkStats[artworkId] = (artworkStats[artworkId] || 0) + time;
    });
  });
  
  res.json({
    recentVisitors,
    artworkStats,
    totalVisitors: visitorList.length,
  });
});

app.post('/api/visitors', (req, res) => {
  const { nickname } = req.body;
  const id = uuidv4();
  const defaultNickname = nickname || '访客' + Math.floor(Math.random() * 10000);
  
  visitors[id] = {
    id,
    nickname: defaultNickname,
    startTime: Date.now(),
    duration: 0,
    completionRate: 0,
    artworkStayTimes: {},
  };
  visitorList.unshift(id);
  
  if (visitorList.length > 100) {
    const oldId = visitorList.pop();
    if (oldId) delete visitors[oldId];
  }
  
  res.status(201).json(visitors[id]);
});

app.put('/api/visitors/:id', (req, res) => {
  const visitor = visitors[req.params.id];
  if (!visitor) {
    return res.status(404).json({ error: '访客不存在' });
  }
  
  const { duration, artworkStayTimes, completionRate } = req.body;
  if (duration !== undefined) visitor.duration = duration;
  if (artworkStayTimes !== undefined) visitor.artworkStayTimes = artworkStayTimes;
  if (completionRate !== undefined) visitor.completionRate = completionRate;
  
  res.json(visitor);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`默认展览ID: ${defaultExhibitionId}`);
});
