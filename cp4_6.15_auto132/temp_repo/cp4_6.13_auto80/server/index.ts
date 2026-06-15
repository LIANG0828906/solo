import express from 'express';
import cors from 'cors';
import userRoutes from './userRoutes';
import skillRoutes from './skillRoutes';
import { initDatabase } from './database';

const app = express();
const PORT = 3001;

initDatabase();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '技能交换平台 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;
