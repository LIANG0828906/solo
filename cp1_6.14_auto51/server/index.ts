import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Post, Platform, EngagementData, DailyTrend, DashboardStats, User } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface DbData {
  users: User[];
  posts: Post[];
  engagement: DailyTrend[];
}

const dbPath = path.join(__dirname, 'db.json');
const adapter = new JSONFile<DbData>(dbPath);
const db = new Low(adapter, {
  users: [],
  posts: [],
  engagement: [],
});

async function initDb() {
  await db.read();
  
  if (db.data.users.length === 0) {
    db.data.users.push({
      id: uuidv4(),
      username: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    });
  }

  if (db.data.posts.length === 0) {
    const now = new Date();
    const platforms: Platform[] = ['weibo', 'wechat', 'douyin', 'bilibili'];
    const samplePosts: Post[] = [
      {
        id: uuidv4(),
        title: '2024年内容创作趋势分析',
        content: '随着短视频平台的崛起，内容创作正在经历前所未有的变革。本文将深入分析当前的创作趋势...',
        summary: '分析2024年内容创作行业的主要趋势，包括短视频、AI辅助创作等热点方向。',
        platform: 'weibo',
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'queued',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: '如何提升公众号文章打开率',
        content: '在信息过载的时代，如何让你的文章在众多推送中脱颖而出？今天分享几个实用技巧...',
        summary: '分享提升公众号文章打开率的实用技巧，包括标题优化、封面设计等。',
        platform: 'wechat',
        scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: '抖音爆款视频的秘密',
        content: '你是否好奇为什么有些视频能在一夜之间爆火？背后其实有一套可复制的方法论...',
        summary: '揭秘抖音爆款视频的制作秘诀，从选题到剪辑全方位解析。',
        platform: 'douyin',
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'queued',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: 'B站UP主成长指南',
        content: '作为一个B站UP主，如何从零开始积累粉丝？这篇指南将帮你少走弯路...',
        summary: '为B站新人UP主提供成长建议，涵盖内容定位、粉丝互动等方面。',
        platform: 'bilibili',
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: 'AI工具在内容创作中的应用',
        content: '人工智能正在深刻改变内容创作的方式。从文案生成到图片设计，AI工具能帮我们做什么...',
        summary: '探讨AI工具在内容创作各环节的应用场景和实际效果。',
        platform: 'weibo',
        scheduledAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'queued',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
    db.data.posts.push(...samplePosts);
  }

  if (db.data.engagement.length === 0) {
    const platforms: Platform[] = ['weibo', 'wechat', 'douyin', 'bilibili'];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      platforms.forEach((platform) => {
        db.data.engagement.push({
          date: dateStr,
          platform,
          likes: Math.floor(Math.random() * 500) + 100,
          comments: Math.floor(Math.random() * 100) + 20,
          shares: Math.floor(Math.random() * 50) + 10,
        });
      });
    }
  }

  await db.write();
}

initDb().then(() => {
  console.log('Database initialized');
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    const user = db.data.users.find((u) => u.username === username);
    if (user) {
      res.json({ user, token: 'mock-jwt-token-' + uuidv4() });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

app.get('/api/posts', async (req, res) => {
  const { status, platform } = req.query;
  let posts = [...db.data.posts];
  
  if (status) {
    posts = posts.filter((p) => p.status === status);
  }
  if (platform) {
    posts = posts.filter((p) => p.platform === platform);
  }
  
  posts.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  res.json(posts);
});

app.get('/api/posts/:id', async (req, res) => {
  const post = db.data.posts.find((p) => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/posts', async (req, res) => {
  const now = new Date().toISOString();
  const newPost: Post = {
    id: uuidv4(),
    title: req.body.title || '',
    content: req.body.content || '',
    summary: req.body.summary || '',
    platform: req.body.platform || 'weibo',
    scheduledAt: req.body.scheduledAt || now,
    status: req.body.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };
  
  db.data.posts.push(newPost);
  await db.write();
  res.status(201).json(newPost);
});

app.put('/api/posts/:id', async (req, res) => {
  const postIndex = db.data.posts.findIndex((p) => p.id === req.params.id);
  if (postIndex === -1) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  
  const updatedPost = {
    ...db.data.posts[postIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  
  db.data.posts[postIndex] = updatedPost;
  await db.write();
  res.json(updatedPost);
});

app.delete('/api/posts/:id', async (req, res) => {
  const postIndex = db.data.posts.findIndex((p) => p.id === req.params.id);
  if (postIndex === -1) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  
  db.data.posts.splice(postIndex, 1);
  await db.write();
  res.json({ success: true });
});

app.get('/api/dashboard/stats', async (_req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklyPosts = db.data.posts.filter((p) => {
    const scheduled = new Date(p.scheduledAt);
    return scheduled >= weekAgo && scheduled <= now;
  }).length;
  
  const totalEngagement = db.data.engagement.reduce((sum, e) => {
    return sum + e.likes + e.comments + e.shares;
  }, 0);
  
  const pendingDrafts = db.data.posts.filter((p) => p.status === 'draft').length;
  
  const stats: DashboardStats = {
    weeklyPosts,
    totalEngagement,
    pendingDrafts,
  };
  
  res.json(stats);
});

app.get('/api/engagement', async (_req, res) => {
  const platforms: Platform[] = ['weibo', 'wechat', 'douyin', 'bilibili'];
  const result: EngagementData[] = platforms.map((platform) => {
    const platformData = db.data.engagement.filter((e) => e.platform === platform);
    const totalLikes = platformData.reduce((sum, e) => sum + e.likes, 0);
    const totalComments = platformData.reduce((sum, e) => sum + e.comments, 0);
    const totalShares = platformData.reduce((sum, e) => sum + e.shares, 0);
    const avgEngagementRate = parseFloat(((totalLikes + totalComments + totalShares) / (platformData.length * 10)).toFixed(2));
    
    return {
      platform,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      avgEngagementRate,
    };
  });
  
  res.json(result);
});

app.get('/api/engagement/trend', async (req, res) => {
  const { platform } = req.query;
  let data = [...db.data.engagement];
  
  if (platform) {
    data = data.filter((e) => e.platform === platform);
  }
  
  const grouped: Record<string, DailyTrend> = {};
  data.forEach((item) => {
    if (!grouped[item.date]) {
      grouped[item.date] = {
        date: item.date,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
    grouped[item.date].likes += item.likes;
    grouped[item.date].comments += item.comments;
    grouped[item.date].shares += item.shares;
  });
  
  const result = Object.values(grouped).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  res.json(result);
});

app.post('/api/ai/summary', async (req, res) => {
  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: '内容不能为空' });
    return;
  }
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  let summary = content.replace(/[。！？]/g, '，').split('，').slice(0, 3).join('，');
  
  if (summary.length > 90) {
    summary = summary.substring(0, 87) + '...';
  }
  
  if (!summary.endsWith('。')) {
    summary = summary + '。';
  }
  
  res.json({ summary });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
