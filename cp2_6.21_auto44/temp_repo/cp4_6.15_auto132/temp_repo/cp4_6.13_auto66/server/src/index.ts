import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { initDb } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

initDb();
console.log('Database initialized');

app.listen(PORT, () => {
  console.log(`Coffee Creative Lab server running on port ${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

export default app;
