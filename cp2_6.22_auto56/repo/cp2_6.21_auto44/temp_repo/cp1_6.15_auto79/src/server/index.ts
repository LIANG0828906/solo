import express from 'express';
import cors from 'cors';
import http from 'http';
import projectsRouter from './routes/projects.js';
import versionsRouter from './routes/versions.js';
import { initSocketIO } from './socket.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/projects', projectsRouter);
app.use('/api/projects', versionsRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

const server = http.createServer(app);
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
