import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import authRouter from './routes/auth.js';
import worksRouter from './routes/works.js';
import invitationsRouter from './routes/invitations.js';
import inspirationsRouter from './routes/inspirations.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/works', worksRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/inspirations', inspirationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '创意写作平台 API 运行正常' });
});

async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
