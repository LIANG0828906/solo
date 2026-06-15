import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes';
import artifactsRouter from './routes/artifacts.routes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/artifacts', artifactsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`竹编工坊服务器运行在 http://localhost:${PORT}`);
});
