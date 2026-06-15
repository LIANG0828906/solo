import express from 'express';
import cors from 'cors';
import db from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/stars', async (req, res) => {
  try {
    await db.read();
    res.json(db.data.stars);
  } catch (error) {
    console.error('获取星系数据失败:', error);
    res.status(500).json({ error: '获取星系数据失败' });
  }
});

app.get('/api/stars/:id', async (req, res) => {
  try {
    await db.read();
    const star = db.data.stars.find(s => s.id === req.params.id);
    if (!star) {
      return res.status(404).json({ error: '未找到该恒星' });
    }
    res.json(star);
  } catch (error) {
    console.error('获取恒星数据失败:', error);
    res.status(500).json({ error: '获取恒星数据失败' });
  }
});

app.listen(PORT, () => {
  console.log(`星系数据API服务运行在 http://localhost:${PORT}`);
  console.log(`GET /api/stars - 获取所有恒星数据`);
});
