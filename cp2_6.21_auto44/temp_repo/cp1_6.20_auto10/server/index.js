const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_PATH = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

const readData = () => {
  const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(rawData);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
};

app.get('/api/works', (req, res) => {
  try {
    const data = readData();
    let works = [...data.works];
    const { category } = req.query;
    
    if (category) {
      works = works.filter(work => work.category === category);
    }
    
    res.json(works);
  } catch (error) {
    res.status(500).json({ error: '获取作品列表失败' });
  }
});

app.get('/api/works/:id', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const work = data.works.find(w => w.id === id);
    
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }
    
    work.views += 1;
    work.updatedAt = new Date().toISOString();
    writeData(data);
    
    res.json(work);
  } catch (error) {
    res.status(500).json({ error: '获取作品详情失败' });
  }
});

app.post('/api/works', (req, res) => {
  try {
    const data = readData();
    const { title, description, category, coverUrl } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    const newId = data.works.length > 0 
      ? Math.max(...data.works.map(w => w.id)) + 1 
      : 1;
    
    const newWork = {
      id: newId,
      title,
      description,
      category,
      coverUrl: coverUrl || '',
      views: 0,
      likes: 0,
      likedIps: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.works.push(newWork);
    writeData(data);
    
    res.status(201).json(newWork);
  } catch (error) {
    res.status(500).json({ error: '创建作品失败' });
  }
});

app.put('/api/works/:id', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.works.findIndex(w => w.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '作品不存在' });
    }
    
    const { title, description, category, coverUrl } = req.body;
    
    data.works[index] = {
      ...data.works[index],
      title: title !== undefined ? title : data.works[index].title,
      description: description !== undefined ? description : data.works[index].description,
      category: category !== undefined ? category : data.works[index].category,
      coverUrl: coverUrl !== undefined ? coverUrl : data.works[index].coverUrl,
      updatedAt: new Date().toISOString()
    };
    
    writeData(data);
    res.json(data.works[index]);
  } catch (error) {
    res.status(500).json({ error: '更新作品失败' });
  }
});

app.delete('/api/works/:id', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.works.findIndex(w => w.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '作品不存在' });
    }
    
    data.works.splice(index, 1);
    writeData(data);
    
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除作品失败' });
  }
});

app.post('/api/works/:id/like', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const work = data.works.find(w => w.id === id);
    
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }
    
    const clientIp = getClientIp(req);
    
    if (work.likedIps.includes(clientIp)) {
      return res.status(400).json({ error: '您已经点过赞了' });
    }
    
    work.likedIps.push(clientIp);
    work.likes += 1;
    work.updatedAt = new Date().toISOString();
    writeData(data);
    
    res.json({ likes: work.likes, liked: true });
  } catch (error) {
    res.status(500).json({ error: '点赞失败' });
  }
});

app.post('/api/works/:id/comments', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const work = data.works.find(w => w.id === id);
    
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }
    
    const { username, content } = req.body;
    
    if (!username || !content) {
      return res.status(400).json({ error: '用户名和评论内容不能为空' });
    }
    
    const newCommentId = work.comments.length > 0 
      ? Math.max(...work.comments.map(c => c.id)) + 1 
      : 1;
    
    const newComment = {
      id: newCommentId,
      username,
      content,
      createdAt: new Date().toISOString()
    };
    
    work.comments.push(newComment);
    work.updatedAt = new Date().toISOString();
    writeData(data);
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: '添加评论失败' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const data = readData();
    const works = data.works;
    
    const totalWorks = works.length;
    const totalViews = works.reduce((sum, w) => sum + w.views, 0);
    const totalLikes = works.reduce((sum, w) => sum + w.likes, 0);
    
    const categoryCount = works.reduce((acc, w) => {
      acc[w.category] = (acc[w.category] || 0) + 1;
      return acc;
    }, {});
    
    const top5 = [...works]
      .sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2))
      .slice(0, 5)
      .map(w => ({
        id: w.id,
        title: w.title,
        category: w.category,
        views: w.views,
        likes: w.likes,
        coverUrl: w.coverUrl
      }));
    
    res.json({
      totalWorks,
      totalViews,
      totalLikes,
      categoryCount,
      top5
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});