import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import woodRouter from './routes/wood';
import toolsRouter from './routes/tools';
import './database';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/projects', projectsRouter);
app.use('/api/wood', woodRouter);
app.use('/api/tools', toolsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '木作工坊管理系统 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`木作工坊管理系统后端服务已启动，监听端口 ${PORT}`);
  console.log(`API 基础地址: http://localhost:${PORT}/api`);
});
