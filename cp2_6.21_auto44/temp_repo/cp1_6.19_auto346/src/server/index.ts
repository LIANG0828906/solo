import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/ai/command', (_req, res) => {
  const types: ('surround' | 'disperse' | 'formation')[] = ['surround', 'disperse', 'formation'];
  const type = types[Math.floor(Math.random() * types.length)];
  const target = {
    x: 200 + Math.random() * 400,
    y: 150 + Math.random() * 300,
  };
  const params: { radius?: number; width?: number; arc?: boolean } = {};
  if (type === 'surround' || type === 'disperse') {
    params.radius = 80 + Math.random() * 80;
  }
  if (type === 'formation') {
    params.width = 150 + Math.random() * 200;
    params.arc = Math.random() > 0.5;
  }
  res.json({
    type,
    target,
    params,
    timestamp: Date.now(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Galactic Fleet Tactics API running on port ${PORT}`);
});

export default app;
