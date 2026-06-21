import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import { register, login, getCurrentUser, authMiddleware, AuthRequest } from './auth';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

initDatabase();

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authMiddleware, getCurrentUser as (req: AuthRequest, res: express.Response) => void);

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
