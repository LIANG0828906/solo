import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let users = [];
let charts = [];
let comments = [];
let favorites = [];

const zodiacSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const planetNames = ['太阳', '月亮', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
const cities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '武汉', '西安', '重庆'];

function generateRandomChart(userId, userIndex) {
  const birthDate = new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const planets = planetNames.map((name, i) => ({
    name,
    degree: Math.random() * 30,
    sign: zodiacSigns[Math.floor(Math.random() * 12)],
    house: Math.floor(Math.random() * 12) + 1,
    longitude: Math.random() * 360,
  }));
  
  const annotations = {};
  if (Math.random() > 0.5) {
    annotations['太阳'] = '太阳落在' + planets[0].sign + '，代表自我意识和生命力的表达方式。';
  }
  if (Math.random() > 0.6) {
    annotations['月亮'] = '月亮落在' + planets[1].sign + '，反映内心世界和情感需求。';
  }
  
  const titles = [
    '我的人生蓝图', '探索内在星空', '命运的指引', '星空中的自己',
    '宇宙的密码', '灵魂的地图', '出生时的星空', '占星分析报告'
  ];
  
  return {
    id: uuidv4(),
    userId,
    title: titles[userIndex % titles.length],
    birthDate: birthDate.toISOString().split('T')[0],
    birthTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    city: cities[Math.floor(Math.random() * cities.length)],
    timezone: 'Asia/Shanghai',
    latitude: 30 + Math.random() * 10,
    longitude: 105 + Math.random() * 20,
    planets,
    houses: Array.from({ length: 12 }, () => Math.random() * 30),
    annotations,
    likes: Math.floor(Math.random() * 100),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function initMockData() {
  const mockUsers = [
    { id: uuidv4(), nickname: '星空漫步者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=star1', createdAt: new Date().toISOString() },
    { id: uuidv4(), nickname: '月光诗人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moon2', createdAt: new Date().toISOString() },
    { id: uuidv4(), nickname: '占星师Leo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo3', createdAt: new Date().toISOString() },
  ];
  users = mockUsers;

  mockUsers.forEach((user, idx) => {
    const chartCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < chartCount; i++) {
      const chart = generateRandomChart(user.id, idx * 2 + i);
      charts.push(chart);
      
      const commentCount = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < commentCount; j++) {
        const commentUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        comments.push({
          id: uuidv4(),
          chartId: chart.id,
          userId: commentUser.id,
          userNickname: commentUser.nickname,
          userAvatar: commentUser.avatar,
          content: [
            '这个星盘分析太精彩了！',
            '我也是同样的配置，深有同感。',
            '请问这个相位怎么解读？',
            '感谢分享，学到了很多！',
            '你的注解很有启发性。',
          ][Math.floor(Math.random() * 5)],
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }
  });
}

initMockData();

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { nickname, avatar } = req.body;
  const newUser = {
    id: uuidv4(),
    nickname,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuidv4()}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  res.json(newUser);
});

app.get('/api/charts', (req, res) => {
  const { search, userId } = req.query;
  let result = [...charts];
  
  if (search) {
    const searchLower = String(search).toLowerCase();
    result = result.filter(chart => 
      chart.title.toLowerCase().includes(searchLower) ||
      users.find(u => u.id === chart.userId)?.nickname.toLowerCase().includes(searchLower) ||
      chart.planets.some(p => p.name.includes(search) || p.sign.includes(search))
    );
  }
  
  if (userId) {
    result = result.filter(chart => chart.userId === userId);
  }
  
  const summaries = result.map(chart => {
    const user = users.find(u => u.id === chart.userId);
    return {
      id: chart.id,
      userId: chart.userId,
      userNickname: user?.nickname || '未知用户',
      userAvatar: user?.avatar || '',
      title: chart.title,
      birthDate: chart.birthDate,
      city: chart.city,
      planetCount: chart.planets.length,
      annotationCount: Object.keys(chart.annotations || {}).length,
      likes: chart.likes,
      createdAt: chart.createdAt,
    };
  });
  
  summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(summaries);
});

app.get('/api/charts/:id', (req, res) => {
  const chart = charts.find(c => c.id === req.params.id);
  if (!chart) return res.status(404).json({ error: 'Chart not found' });
  
  const user = users.find(u => u.id === chart.userId);
  res.json({
    ...chart,
    userNickname: user?.nickname || '未知用户',
    userAvatar: user?.avatar || '',
  });
});

app.post('/api/charts', (req, res) => {
  const chartData = req.body;
  const newChart = {
    ...chartData,
    id: uuidv4(),
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  charts.push(newChart);
  res.json({ id: newChart.id, success: true });
});

app.put('/api/charts/:id/like', (req, res) => {
  const chart = charts.find(c => c.id === req.params.id);
  if (!chart) return res.status(404).json({ error: 'Chart not found' });
  
  chart.likes += 1;
  res.json({ likes: chart.likes, success: true });
});

app.get('/api/comments', (req, res) => {
  const { chartId } = req.query;
  let result = [...comments];
  
  if (chartId) {
    result = result.filter(c => c.chartId === chartId);
  }
  
  result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(result);
});

app.post('/api/comments', (req, res) => {
  const { chartId, userId, content } = req.body;
  const user = users.find(u => u.id === userId);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const newComment = {
    id: uuidv4(),
    chartId,
    userId,
    userNickname: user.nickname,
    userAvatar: user.avatar,
    content,
    createdAt: new Date().toISOString(),
  };
  
  comments.push(newComment);
  res.json(newComment);
});

app.get('/api/favorites', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  
  const userFavs = favorites.filter(f => f.userId === userId);
  const favCharts = userFavs.map(fav => {
    const chart = charts.find(c => c.id === fav.chartId);
    const user = chart ? users.find(u => u.id === chart.userId) : null;
    return chart ? {
      id: chart.id,
      userId: chart.userId,
      userNickname: user?.nickname || '未知用户',
      userAvatar: user?.avatar || '',
      title: chart.title,
      birthDate: chart.birthDate,
      city: chart.city,
      annotationCount: Object.keys(chart.annotations || {}).length,
      likes: chart.likes,
      createdAt: fav.createdAt,
    } : null;
  }).filter(Boolean);
  
  favCharts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(favCharts);
});

app.post('/api/favorites', (req, res) => {
  const { userId, chartId } = req.body;
  
  const existing = favorites.find(f => f.userId === userId && f.chartId === chartId);
  if (existing) {
    return res.json({ success: false, message: 'Already favorited' });
  }
  
  favorites.push({
    id: uuidv4(),
    userId,
    chartId,
    createdAt: new Date().toISOString(),
  });
  
  res.json({ success: true, message: '已收藏' });
});

app.delete('/api/favorites', (req, res) => {
  const { userId, chartId } = req.body;
  
  const index = favorites.findIndex(f => f.userId === userId && f.chartId === chartId);
  if (index === -1) {
    return res.status(404).json({ error: 'Favorite not found' });
  }
  
  favorites.splice(index, 1);
  res.json({ success: true, message: '已取消收藏' });
});

app.get('/api/favorites/check', (req, res) => {
  const { userId, chartId } = req.query;
  const exists = favorites.some(f => f.userId === userId && f.chartId === chartId);
  res.json({ isFavorited: exists });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mock data initialized: ${users.length} users, ${charts.length} charts, ${comments.length} comments`);
});
