import express from 'express';
import cors from 'cors';
import gameRoutes from './routes/gameRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/game', gameRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '记忆训练后端服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`🚀 记忆训练后端服务已启动: http://localhost:${PORT}`);
});
