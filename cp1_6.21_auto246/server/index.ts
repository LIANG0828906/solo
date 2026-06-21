import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import templatesRouter from './routes/templates';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    code: 0,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    },
    message: 'success'
  });
});

app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);

app.use((_req, res) => {
  res.status(404).json({ code: 404, data: null, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`[server] Server is running at http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
