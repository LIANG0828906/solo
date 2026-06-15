import express from 'express';
import cors from 'cors';
import moleculeRouter from './routes/molecule';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/api/molecule', moleculeRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '分子解析服务运行中' });
});

app.listen(PORT, () => {
  console.log(`🚀 分子解析后端服务已启动: http://localhost:${PORT}`);
});
