import express from 'express';
import cors from 'cors';
import matchRouter from './routes/match.js';
import transactionsRouter from './routes/transactions.js';
import ratingsRouter from './routes/ratings.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/match', matchRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/ratings', ratingsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || '服务端错误' });
});

app.listen(PORT, () => {
  console.log(`[server] 合租平台后端服务已启动: http://localhost:${PORT}`);
});
