import express from 'express';
import cors from 'cors';
import db from './db';
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import borrowRoutes from './routes/borrows';
import reviewRoutes from './routes/reviews';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Book Drift API 运行正常' });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api', reviewRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
