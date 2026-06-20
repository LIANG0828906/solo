
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import walnutsRouter from './routes/walnuts.js';
import userRouter from './routes/user.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/walnuts', walnutsRouter);
app.use('/api/user', userRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '文玩核桃鉴藏阁服务已启动' });
});

app.listen(PORT, () => {
  console.log(`🚀 文玩核桃鉴藏阁后端服务已启动: http://localhost:${PORT}`);
});
