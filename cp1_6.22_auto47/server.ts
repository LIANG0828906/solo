import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
}

const screenshots: Screenshot[] = [];

app.post('/api/screenshots', (req, res) => {
  const { dataUrl } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const screenshot: Screenshot = {
    id,
    dataUrl,
    timestamp: Date.now()
  };

  screenshots.push(screenshot);

  if (screenshots.length > 50) {
    screenshots.shift();
  }

  res.json({ id, downloadUrl: `/api/screenshots/${id}/download` });
});

app.get('/api/screenshots/:id/download', (req, res) => {
  const { id } = req.params;
  const screenshot = screenshots.find(s => s.id === id);

  if (!screenshot) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }

  const dataUrl = screenshot.dataUrl;
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const imgBuffer = Buffer.from(base64Data, 'base64');

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="makeup-${screenshot.timestamp}.png"`);
  res.send(imgBuffer);
});

app.get('/api/screenshots/:id', (req, res) => {
  const { id } = req.params;
  const screenshot = screenshots.find(s => s.id === id);

  if (!screenshot) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }

  res.json({ id: screenshot.id, timestamp: screenshot.timestamp });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
