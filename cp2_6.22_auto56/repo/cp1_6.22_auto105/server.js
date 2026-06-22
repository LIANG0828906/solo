import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let sources = [
  {
    id: '1',
    name: '阮一峰的网络日志',
    type: 'rss',
    url: 'https://www.ruanyifeng.com/blog/atom.xml',
  },
  {
    id: '2',
    name: 'TechLead YouTube',
    type: 'youtube',
    url: 'https://www.youtube.com/@TechLead',
  },
  {
    id: '3',
    name: '字节跳动技术团队',
    type: 'rss',
    url: 'https://juejin.cn/rss/team/6943816575183749134',
  },
  {
    id: '4',
    name: 'Marques Brownlee',
    type: 'youtube',
    url: 'https://www.youtube.com/@mkbhd',
  },
  {
    id: '5',
    name: '机核网播客',
    type: 'podcast',
    url: 'https://www.gcores.com/rss/podcast',
  },
  {
    id: '6',
    name: '忽左忽右',
    type: 'podcast',
    url: 'https://feeds.simplecast.com/5h2X_QuQ',
  },
];

function generateArticles(sourceId, count = 10) {
  const articles = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const publishTime = now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000);
    
    articles.push({
      id: uuidv4(),
      sourceId,
      title: `示例文章标题 ${i + 1} - 关于技术、生活与思考`,
      summary: '这是一篇示例文章的摘要内容，包含了一些关于技术发展、行业动态和个人思考的文字，用于展示文章列表的效果。文章内容丰富多样，涵盖了多个领域的知识和见解。',
      publishTime,
      isRead: i >= 3,
    });
  }
  return articles.sort((a, b) => b.publishTime - a.publishTime);
}

let articles = {};
sources.forEach(source => {
  articles[source.id] = generateArticles(source.id);
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/api/sources', async (req, res) => {
  await delay(100 + Math.random() * 100);
  const sourcesWithUnread = sources.map(source => {
    const sourceArticles = articles[source.id] || [];
    const unreadCount = sourceArticles.filter(a => !a.isRead).length;
    return { ...source, unreadCount };
  });
  res.json(sourcesWithUnread);
});

app.post('/api/sources', async (req, res) => {
  await delay(100 + Math.random() * 100);
  const { name, type, url } = req.body;
  
  if (!name || !type || !url) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const newSource = {
    id: uuidv4(),
    name,
    type,
    url,
  };
  
  sources.push(newSource);
  articles[newSource.id] = generateArticles(newSource.id, 8);
  
  const unreadCount = articles[newSource.id].filter(a => !a.isRead).length;
  res.status(201).json({ ...newSource, unreadCount });
});

app.get('/api/sources/:sourceId/articles', async (req, res) => {
  await delay(100 + Math.random() * 100);
  const { sourceId } = req.params;
  const sourceArticles = articles[sourceId];
  
  if (!sourceArticles) {
    return res.status(404).json({ error: '订阅源不存在' });
  }
  
  res.json(sourceArticles);
});

app.patch('/api/articles/:articleId', async (req, res) => {
  await delay(50 + Math.random() * 50);
  const { articleId } = req.params;
  const { isRead } = req.body;
  
  for (const sourceId of Object.keys(articles)) {
    const articleIndex = articles[sourceId].findIndex(a => a.id === articleId);
    if (articleIndex !== -1) {
      articles[sourceId][articleIndex].isRead = isRead;
      return res.json(articles[sourceId][articleIndex]);
    }
  }
  
  res.status(404).json({ error: '文章不存在' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
