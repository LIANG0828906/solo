import express from 'express';
import multer from 'multer';
import { parseCSV } from './csvParser';

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const content = req.file.buffer.toString('utf-8');
    const result = parseCSV(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse CSV' });
  }
});

app.get('/api/sample', (_req, res) => {
  const size = 100;
  const data: number[][] = [];
  for (let i = 0; i < size; i++) {
    data[i] = [];
    for (let j = 0; j < size; j++) {
      const x = (j - size / 2) / 10;
      const y = (i - size / 2) / 10;
      data[i][j] = Math.sin(x) * Math.cos(y) * 30 + Math.sin(x * 0.5 + y * 0.3) * 20;
    }
  }
  let min = Infinity, max = -Infinity, sum = 0, count = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      min = Math.min(min, data[i][j]);
      max = Math.max(max, data[i][j]);
      sum += data[i][j];
      count++;
    }
  }
  res.json({ data, rows: size, cols: size, min, max, avg: sum / count });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
