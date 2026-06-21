import express from 'express';
import cors from 'cors';
import boardRoutes from './boardRoutes';
import noteRoutes from './noteRoutes';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.use('/api/boards', boardRoutes);
app.use('/api', noteRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] 墨迹协作后端服务已启动: http://localhost:${PORT}`);
});
