import express from 'express';
import cors from 'cors';
import menuRoutes from './routes/menuRoutes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', menuRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
