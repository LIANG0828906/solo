import express from 'express';
import cors from 'cors';
import { fetchRouter } from './routes/fetch';
import { resourcesRouter, populateDemoData } from './routes/resources';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() }, timestamp: Date.now() });
});

app.use('/api', fetchRouter);
app.use('/api', resourcesRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API 端点不存在' }, timestamp: Date.now() });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[APP ERROR]', err);
  res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'unknown' }, timestamp: Date.now() });
});

populateDemoData();

app.listen(PORT, () => {
  console.log(`\n🚀 后端服务启动于 http://localhost:${PORT}`);
  console.log(`📚 已加载演示数据: 10 条示例资源\n`);
});
