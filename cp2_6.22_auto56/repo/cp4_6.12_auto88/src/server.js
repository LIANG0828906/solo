const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, '..', 'data', 'memes.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

function readMemes() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeMemes(memes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memes, null, 2), 'utf-8');
}

app.get('/api/memes', (req, res) => {
  const memes = readMemes();
  const { page = 1, limit = 20, tag } = req.query;
  let filtered = memes;
  if (tag) {
    filtered = memes.filter((m) => m.tags && m.tags.includes(tag));
  }
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);
  const start = (p - 1) * l;
  const paginated = filtered.slice(start, start + l);
  res.json({ memes: paginated, total: filtered.length });
});

app.get('/api/memes/:id', (req, res) => {
  const memes = readMemes();
  const meme = memes.find((m) => m.id === req.params.id);
  if (!meme) return res.status(404).json({ error: 'Not found' });
  res.json(meme);
});

app.post('/api/memes', upload.single('image'), (req, res) => {
  const memes = readMemes();
  const { name, tags } = req.body;
  if (!name || !req.file) {
    return res.status(400).json({ error: 'Name and image are required' });
  }
  const parsedTags = tags
    ? String(tags)
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .slice(0, 5)
    : [];
  const meme = {
    id: uuidv4(),
    name: String(name).slice(0, 20),
    tags: parsedTags,
    imageUrl: `/uploads/${req.file.filename}`,
    author: '匿名',
    likes: 0,
    liked: false,
    downloads: 0,
    createdAt: new Date().toISOString(),
  };
  memes.unshift(meme);
  writeMemes(memes);
  res.status(201).json(meme);
});

app.post('/api/memes/:id/like', (req, res) => {
  const memes = readMemes();
  const meme = memes.find((m) => m.id === req.params.id);
  if (!meme) return res.status(404).json({ error: 'Not found' });
  if (meme.liked) {
    meme.likes = Math.max(0, meme.likes - 1);
    meme.liked = false;
  } else {
    meme.likes += 1;
    meme.liked = true;
  }
  writeMemes(memes);
  res.json(meme);
});

app.put('/api/memes/:id', (req, res) => {
  const memes = readMemes();
  const idx = memes.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, tags } = req.body;
  if (name) memes[idx].name = String(name).slice(0, 20);
  if (tags) memes[idx].tags = String(tags).split(/\s+/).filter((t) => t.length > 0).slice(0, 5);
  writeMemes(memes);
  res.json(memes[idx]);
});

app.delete('/api/memes/:id', (req, res) => {
  let memes = readMemes();
  const meme = memes.find((m) => m.id === req.params.id);
  if (!meme) return res.status(404).json({ error: 'Not found' });
  if (meme.imageUrl) {
    const imgPath = path.join(__dirname, '..', meme.imageUrl);
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
    }
  }
  memes = memes.filter((m) => m.id !== req.params.id);
  writeMemes(memes);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
