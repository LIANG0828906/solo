import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { galleryService, CanvasComponent, CanvasText } from './galleryService';
import { interactionService } from './interactionService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = galleryService.getUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 }
});

app.get('/api/gallery', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = galleryService.getMemes(page, limit);
  res.json(result);
});

app.get('/api/gallery/:id', (req, res) => {
  const meme = galleryService.getMemeById(req.params.id);
  if (!meme) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(meme);
});

app.post('/api/gallery', upload.single('image'), (req, res) => {
  try {
    const author = req.body.author || '匿名用户';
    const tags = JSON.parse(req.body.tags || '[]');
    const description = req.body.description || '';
    const components = JSON.parse(req.body.components || '[]') as CanvasComponent[];
    const text = req.body.text ? JSON.parse(req.body.text) : null;
    const imageFilename = req.file ? req.file.filename : '';

    const meme = galleryService.createMeme(imageFilename, author, tags, description, components, text);
    res.status(201).json(meme);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to create meme' });
  }
});

app.delete('/api/gallery/:id', (req, res) => {
  const deleted = galleryService.deleteMeme(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ success: true });
});

app.post('/api/interact/like/:id', (req, res) => {
  const userId = req.body.userId || 'anonymous';
  const result = interactionService.likeMeme(req.params.id, userId);
  res.json(result);
});

app.get('/api/interact/like/:id/status', (req, res) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const liked = interactionService.hasLiked(req.params.id, userId);
  const likes = interactionService.getLikesCount(req.params.id);
  res.json({ liked, likes });
});

app.get('/api/interact/comments/:id', (req, res) => {
  const comments = interactionService.getComments(req.params.id);
  res.json(comments);
});

app.post('/api/interact/comments/:id', (req, res) => {
  const { author, content } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }
  const comment = interactionService.addComment(req.params.id, author || '匿名用户', content);
  res.status(201).json(comment);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
