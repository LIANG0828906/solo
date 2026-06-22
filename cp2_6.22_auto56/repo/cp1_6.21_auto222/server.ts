import express from 'express';
import cors from 'cors';
import archiveRoutes from './src/api/archiveRoutes';
import leaderboardRoutes from './src/api/leaderboardRoutes';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/api', archiveRoutes);
app.use('/api', leaderboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 星尘拓荒后端服务已启动: http://localhost:${PORT}`);
});
