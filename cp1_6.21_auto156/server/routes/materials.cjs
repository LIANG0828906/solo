const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

let materials = [];

router.get('/', (_req, res) => {
  res.json(materials);
});

router.get('/:id', (req, res) => {
  const m = materials.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
});

router.post('/', upload.single('image'), (req, res) => {
  const { title, content, type } = req.body;
  const material = {
    id: uuidv4(),
    title: title || '',
    content: content || '',
    type: type || 'text',
    imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    createdAt: new Date().toISOString(),
  };
  materials.unshift(material);
  res.status(201).json(material);
});

router.put('/:id', upload.single('image'), (req, res) => {
  const idx = materials.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const existing = materials[idx];
  materials[idx] = {
    ...existing,
    title: req.body.title ?? existing.title,
    content: req.body.content ?? existing.content,
    type: req.body.type ?? existing.type,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : existing.imageUrl,
  };
  res.json(materials[idx]);
});

router.delete('/:id', (req, res) => {
  materials = materials.filter((x) => x.id !== req.params.id);
  res.status(204).end();
});

module.exports = { materialRouter: router };
