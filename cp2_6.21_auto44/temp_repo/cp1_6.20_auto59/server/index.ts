import express from 'express';
import cors from 'cors';
import docsRouter from './routes/docs';
import versionsRouter from './routes/versions';
import { getUsers } from './store';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  try {
    const users = getUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

app.use('/api/docs', docsRouter);
app.use('/api/docs/:id/versions', versionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  getUsers();
  console.log('========================================');
  console.log('  文档协作系统后端服务已启动');
  console.log('========================================');
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  文档接口: http://localhost:${PORT}/api/docs`);
  console.log(`  用户接口: http://localhost:${PORT}/api/users`);
  console.log('========================================');
  console.log('  默认模拟用户已初始化:');
  getUsers().forEach((user) => {
    console.log(`    - ${user.name} (${user.id})`);
  });
  console.log('========================================');
});
