import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const dbPath = path.join(__dirname, '..', 'gallery.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artistName TEXT NOT NULL,
    year INTEGER NOT NULL,
    price REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    imageUrl TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    hueShift REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS placements (
    id TEXT PRIMARY KEY,
    artworkId TEXT NOT NULL,
    wallIndex INTEGER NOT NULL,
    posX REAL NOT NULL,
    posY REAL NOT NULL,
    rotation REAL DEFAULT 0,
    FOREIGN KEY (artworkId) REFERENCES artworks(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    artworkId TEXT NOT NULL,
    buyerName TEXT,
    buyerEmail TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artworkId) REFERENCES artworks(id)
  );
`);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持 JPEG 和 PNG 格式'));
  },
});

app.get('/api/artworks', (req, res) => {
  const { status } = req.query;
  let artworks;
  if (status) {
    const stmt = db.prepare('SELECT * FROM artworks WHERE status = ? ORDER BY createdAt DESC');
    artworks = stmt.all(status);
  } else {
    const stmt = db.prepare('SELECT * FROM artworks ORDER BY createdAt DESC');
    artworks = stmt.all();
  }
  res.json(artworks);
});

app.post('/api/artworks/upload', upload.single('image'), (req, res) => {
  try {
    const { title, artistName, year, price, width, height } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }
    const id = uuidv4();
    const hueShift = Math.random() * 30 - 15;
    const imageUrl = `/uploads/${req.file.filename}`;
    const stmt = db.prepare(`
      INSERT INTO artworks (id, title, artistName, year, price, width, height, imageUrl, hueShift)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, artistName, parseInt(year), parseFloat(price), parseFloat(width), parseFloat(height), imageUrl, hueShift);
    const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    res.status(201).json(artwork);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/artworks/:id/approve', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('UPDATE artworks SET status = ? WHERE id = ?');
  stmt.run('approved', id);
  const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
  if (!artwork) {
    return res.status(404).json({ error: '画作不存在' });
  }
  res.json(artwork);
});

app.get('/api/placements', (req, res) => {
  const stmt = db.prepare(`
    SELECT p.*, a.title, a.artistName, a.year, a.price, a.width, a.height, a.imageUrl, a.hueShift
    FROM placements p
    JOIN artworks a ON p.artworkId = a.id
    WHERE a.status = 'approved'
    ORDER BY p.wallIndex, p.posX
  `);
  const placements = stmt.all();
  res.json(placements);
});

app.post('/api/placements/save', (req, res) => {
  const { placements } = req.body;
  const deleteStmt = db.prepare('DELETE FROM placements');
  deleteStmt.run();
  const insertStmt = db.prepare(`
    INSERT INTO placements (id, artworkId, wallIndex, posX, posY, rotation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction((plcs: any[]) => {
    for (const p of plcs) {
      insertStmt.run(p.id || uuidv4(), p.artworkId, p.wallIndex, p.posX, p.posY, p.rotation || 0);
    }
  });
  transaction(placements || []);
  res.json({ success: true, count: placements?.length || 0 });
});

app.get('/api/orders', (req, res) => {
  const stmt = db.prepare(`
    SELECT o.*, a.title, a.price, a.imageUrl
    FROM orders o
    JOIN artworks a ON o.artworkId = a.id
    ORDER BY o.createdAt DESC
  `);
  const orders = stmt.all();
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { artworkId, buyerName, buyerEmail } = req.body;
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO orders (id, artworkId, buyerName, buyerEmail, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  stmt.run(id, artworkId, buyerName, buyerEmail);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(order);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
  stmt.run(status, id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

function initSampleData() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM artworks');
  const { count } = countStmt.get() as { count: number };
  if (count > 0) return;

  const sampleArtworks = [
    { id: uuidv4(), title: '晨曦之光', artistName: '李明', year: 2023, price: 2800, width: 80, height: 60, imageUrl: '/uploads/sample1.jpg', hueShift: 5 },
    { id: uuidv4(), title: '山涧溪流', artistName: '王芳', year: 2022, price: 3500, width: 100, height: 70, imageUrl: '/uploads/sample2.jpg', hueShift: -8 },
    { id: uuidv4(), title: '城市印象', artistName: '张伟', year: 2024, price: 4200, width: 90, height: 65, imageUrl: '/uploads/sample3.jpg', hueShift: 12 },
    { id: uuidv4(), title: '秋日私语', artistName: '陈静', year: 2023, price: 3200, width: 70, height: 90, imageUrl: '/uploads/sample4.jpg', hueShift: -3 },
    { id: uuidv4(), title: '海洋深处', artistName: '赵强', year: 2024, price: 5000, width: 120, height: 80, imageUrl: '/uploads/sample5.jpg', hueShift: 8 },
    { id: uuidv4(), title: '花园小径', artistName: '刘娜', year: 2022, price: 2200, width: 60, height: 80, imageUrl: '/uploads/sample6.jpg', hueShift: -10 },
  ];

  const insertArtwork = db.prepare(`
    INSERT INTO artworks (id, title, artistName, year, price, width, height, imageUrl, hueShift, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `);

  const transaction = db.transaction((artworks: any[]) => {
    for (const art of artworks) {
      insertArtwork.run(art.id, art.title, art.artistName, art.year, art.price, art.width, art.height, art.imageUrl, art.hueShift);
    }
  });
  transaction(sampleArtworks);

  const samplePlacements = [
    { id: uuidv4(), artworkId: sampleArtworks[0].id, wallIndex: 0, posX: -3, posY: 1.5, rotation: -2 },
    { id: uuidv4(), artworkId: sampleArtworks[1].id, wallIndex: 0, posX: 0, posY: 1.5, rotation: 1 },
    { id: uuidv4(), artworkId: sampleArtworks[2].id, wallIndex: 0, posX: 3, posY: 1.5, rotation: -1 },
    { id: uuidv4(), artworkId: sampleArtworks[3].id, wallIndex: 1, posX: -3, posY: 1.5, rotation: 2 },
    { id: uuidv4(), artworkId: sampleArtworks[4].id, wallIndex: 1, posX: 0, posY: 1.5, rotation: 0 },
    { id: uuidv4(), artworkId: sampleArtworks[5].id, wallIndex: 2, posX: -2, posY: 1.5, rotation: -1.5 },
  ];

  const insertPlacement = db.prepare(`
    INSERT INTO placements (id, artworkId, wallIndex, posX, posY, rotation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction2 = db.transaction((placements: any[]) => {
    for (const p of placements) {
      insertPlacement.run(p.id, p.artworkId, p.wallIndex, p.posX, p.posY, p.rotation);
    }
  });
  transaction2(samplePlacements);

  console.log('示例数据已初始化');
}

initSampleData();

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
