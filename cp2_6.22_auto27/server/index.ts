import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(router);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '食谱 API 服务器运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;
