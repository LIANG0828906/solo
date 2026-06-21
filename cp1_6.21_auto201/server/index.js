import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

const dataPath = join(__dirname, 'data', 'exhibitions.json');
const exhibitions = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

app.use(express.json());

app.get('/api/exhibitions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = exhibitions.find((e) => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Exhibition not found' });
  }
  const { recommendedIds, ...detail } = item;
  res.json(detail);
});

app.get('/api/exhibitions/:id/images', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = exhibitions.find((e) => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Exhibition not found' });
  }
  res.json(item.imageFiles);
});

app.get('/api/exhibitions/:id/audio', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = exhibitions.find((e) => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Exhibition not found' });
  }
  res.json({ url: `/api/audio/${item.audioFile}` });
});

app.get('/api/exhibitions/:id/recommend', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = exhibitions.find((e) => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Exhibition not found' });
  }
  const recommended = item.recommendedIds
    .map((rid) => {
      const r = exhibitions.find((e) => e.id === rid);
      if (!r) return null;
      return { id: r.id, name: r.name };
    })
    .filter(Boolean);
  res.json(recommended);
});

app.get('/api/exhibitions/:id/images/:filename', (req, res) => {
  const { id, filename } = req.params;
  const imagesDir = join(__dirname, 'data', 'images', String(id));
  const filePath = join(imagesDir, filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="#1E293B"/>
    <text x="400" y="240" font-family="sans-serif" font-size="20" fill="#475569" text-anchor="middle">展品 #${id}</text>
    <text x="400" y="270" font-family="sans-serif" font-size="14" fill="#64748B" text-anchor="middle">${filename}</text>
  </svg>`);
});

app.get('/api/audio/:filename', (req, res) => {
  const audioDir = join(__dirname, 'data', 'audio');
  const filePath = join(audioDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', mp3Header.length);
  res.send(mp3Header);
});

app.listen(PORT, () => {
  console.log(`Exhibition API server running on http://localhost:${PORT}`);
});
