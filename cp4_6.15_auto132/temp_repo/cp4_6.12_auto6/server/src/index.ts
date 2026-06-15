import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'review-' + unique + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const dbPath = path.resolve(__dirname, '../../data/bookstore.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    publishYear INTEGER,
    publisher TEXT,
    isbn TEXT,
    condition INTEGER NOT NULL,
    conditionDesc TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 1,
    circulationCount INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    coverGradient TEXT,
    status TEXT DEFAULT 'on',
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
  CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
  CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
  CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookId INTEGER NOT NULL,
    userName TEXT NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT,
    images TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bookId) REFERENCES books(id)
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_bookId ON reviews(bookId);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookId INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    totalPrice REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bookId) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 0
  );
`);

const categoryGradients: Record<string, string> = {
  '文学': 'linear-gradient(135deg, #8B4513, #A0522D)',
  '历史': 'linear-gradient(135deg, #1E3A5F, #2E5077)',
  '科技': 'linear-gradient(135deg, #0D7377, #14A7A0)',
  '艺术': 'linear-gradient(135deg, #6B4E71, #8B5F8F)',
  '生活': 'linear-gradient(135deg, #2D5A27, #3D7A37)',
};

function seedData() {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM books').get() as { cnt: number }).cnt;
  if (count > 0) return;

  const insertBook = db.prepare(`
    INSERT INTO books (title, author, category, publishYear, publisher, isbn, condition, conditionDesc, price, circulationCount, sales, coverGradient)
    VALUES (@title, @author, @category, @publishYear, @publisher, @isbn, @condition, @conditionDesc, @price, @circulationCount, @sales, @coverGradient)
  `);

  const books = [
    { title: '百年孤独', author: '加西亚·马尔克斯', category: '文学', publishYear: 2011, publisher: '南海出版公司', isbn: '9787544253994', condition: 4, conditionDesc: '封面轻微磨损内页干净', price: 45, circulationCount: 3, sales: 12 },
    { title: '人类简史', author: '尤瓦尔·赫拉利', category: '历史', publishYear: 2014, publisher: '中信出版社', isbn: '9787508647357', condition: 5, conditionDesc: '几乎全新', price: 68, circulationCount: 2, sales: 8 },
    { title: '代码大全', author: 'Steve McConnell', category: '科技', publishYear: 2006, publisher: '电子工业出版社', isbn: '9787121024481', condition: 3, conditionDesc: '书脊有折痕笔记较多', price: 89, circulationCount: 5, sales: 15 },
    { title: '艺术的故事', author: '贡布里希', category: '艺术', publishYear: 2015, publisher: '广西美术出版社', isbn: '9787549413140', condition: 4, conditionDesc: '封面完好彩图清晰', price: 128, circulationCount: 1, sales: 6 },
    { title: '家常菜大全', author: '美食生活工作室', category: '生活', publishYear: 2018, publisher: '青岛出版社', isbn: '9787555256335', condition: 5, conditionDesc: '全新未翻阅', price: 35, circulationCount: 0, sales: 4 },
    { title: '活着', author: '余华', category: '文学', publishYear: 2012, publisher: '作家出版社', isbn: '9787506365437', condition: 3, conditionDesc: '有少量阅读痕迹', price: 28, circulationCount: 4, sales: 20 },
    { title: '万历十五年', author: '黄仁宇', category: '历史', publishYear: 2007, publisher: '生活读书新知三联书店', isbn: '9787108016834', condition: 4, conditionDesc: '保存良好', price: 38, circulationCount: 2, sales: 10 },
    { title: '深度学习', author: 'Ian Goodfellow', category: '科技', publishYear: 2017, publisher: '人民邮电出版社', isbn: '9787115461708', condition: 5, conditionDesc: '全新塑封', price: 148, circulationCount: 1, sales: 5 },
    { title: '写给大家的西方美术史', author: '蒋勋', category: '艺术', publishYear: 2011, publisher: '湖南美术出版社', isbn: '9787535640101', condition: 2, conditionDesc: '封面有磨损内页完整', price: 55, circulationCount: 6, sales: 3 },
    { title: '断舍离', author: '山下英子', category: '生活', publishYear: 2013, publisher: '广西科学技术出版社', isbn: '9787807639956', condition: 4, conditionDesc: '轻微使用痕迹', price: 25, circulationCount: 3, sales: 18 },
  ];

  const insertReview = db.prepare(`
    INSERT INTO reviews (bookId, userName, rating, content, images)
    VALUES (@bookId, @userName, @rating, @content, @images)
  `);

  const reviewTemplates = [
    ['书虫小李', 5, '非常值得收藏，品相很好！', '[]'],
    ['阅读达人', 4, '内容精彩，包装不错', '[]'],
    ['文艺青年', 5, '经典之作，强烈推荐', '[]'],
    ['旧书爱好者', 3, '有些磨损但内页完好，可以接受', '[]'],
    ['藏书家', 4, '性价比很高，值得入手', '[]'],
  ];

  const transaction = db.transaction(() => {
    for (const book of books) {
      const gradient = categoryGradients[book.category] || 'linear-gradient(135deg, #666, #999)';
      const result = insertBook.run({ ...book, coverGradient: gradient });
      const bookId = result.lastInsertRowid as number;

      const numReviews = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numReviews; j++) {
        const template = reviewTemplates[j % reviewTemplates.length];
        insertReview.run({
          bookId,
          userName: template[0] as string,
          rating: template[1] as number,
          content: template[2] as string,
          images: template[3] as string,
        });
      }
    }

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      db.prepare('INSERT OR IGNORE INTO visits (date, count) VALUES (?, ?)').run(dateStr, Math.floor(Math.random() * 50) + 10);
    }

    for (let i = 0; i < 15; i++) {
      const bookId = (i % 10) + 1;
      const bookRow = db.prepare('SELECT price FROM books WHERE id = ?').get(bookId) as { price: number };
      const qty = Math.floor(Math.random() * 3) + 1;
      const daysAgo = Math.floor(Math.random() * 7);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const createdAt = d.toISOString().slice(0, 10) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
      db.prepare('INSERT INTO orders (bookId, quantity, totalPrice, status, createdAt) VALUES (?, ?, ?, ?, ?)').run(
        bookId,
        qty,
        bookRow.price * qty,
        Math.random() > 0.3 ? 'completed' : 'pending',
        createdAt,
      );
    }
  });

  transaction();
}

seedData();

// --- API Routes ---

// 1. GET /api/books - List books with search, filter, pagination, sort
app.get('/api/books', (req, res) => {
  const { keyword, category, page = '1', pageSize = '20', sort } = req.query;
  const pageNum = Math.max(1, Number(page));
  const pageSizeNum = Math.max(1, Number(pageSize));
  const offset = (pageNum - 1) * pageSizeNum;

  const conditions: string[] = ["status = 'on'"];
  const params: any[] = [];

  if (keyword) {
    conditions.push('(title LIKE ? OR author LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  const where = conditions.join(' AND ');

  let orderBy = 'ORDER BY createdAt DESC';
  if (sort === 'sales') orderBy = 'ORDER BY sales DESC';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM books WHERE ${where}`).get(...params) as { total: number };
  const books = db.prepare(`SELECT * FROM books WHERE ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...params, pageSizeNum, offset);

  res.json({ data: books, total: countRow.total, page: pageNum, pageSize: pageSizeNum });
});

// 2. GET /api/books/price-suggestion
app.get('/api/books/price-suggestion', (req, res) => {
  const year = Number(req.query.year);
  const condition = Number(req.query.condition);

  if (!year || !condition || condition < 1 || condition > 5) {
    res.status(400).json({ error: 'year and condition (1-5) are required' });
    return;
  }

  const basePrice = 50;
  const conditionMultiplier = 1 + (condition - 1) * 0.15;
  const currentYear = new Date().getFullYear();
  const ageDiff = currentYear - year;
  let yearDepreciation: number;
  if (ageDiff > 20) {
    yearDepreciation = 0.6;
  } else {
    yearDepreciation = Math.max(0.6, 1 - ageDiff * 0.02);
  }
  const suggestedPrice = Math.round(basePrice * conditionMultiplier * yearDepreciation * 100) / 100;

  res.json({ suggestedPrice, basePrice, conditionMultiplier, yearDepreciation });
});

// 3. GET /api/books/:id
app.get('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(book);
});

// 4. POST /api/books
app.post('/api/books', (req, res) => {
  const { title, author, category, publishYear, publisher, isbn, condition, conditionDesc, price, stock } = req.body;

  if (!title || !author) {
    res.status(400).json({ error: 'title and author are required' });
    return;
  }
  if (!price || price <= 0) {
    res.status(400).json({ error: 'price must be greater than 0' });
    return;
  }

  const coverGradient = categoryGradients[category] || 'linear-gradient(135deg, #666, #999)';

  const result = db.prepare(`
    INSERT INTO books (title, author, category, publishYear, publisher, isbn, condition, conditionDesc, price, stock, coverGradient)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, author, category, publishYear, publisher, isbn, condition, conditionDesc, price, stock || 1, coverGradient);

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(book);
});

// 5. PUT /api/books/:id
app.put('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];
  const allowedFields = ['title', 'author', 'category', 'publishYear', 'publisher', 'isbn', 'condition', 'conditionDesc', 'price', 'stock', 'circulationCount', 'sales', 'status'];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (req.body.category !== undefined) {
    fields.push('coverGradient = ?');
    values.push(categoryGradients[req.body.category] || 'linear-gradient(135deg, #666, #999)');
  }

  if (fields.length === 0) {
    res.json(book);
    return;
  }

  values.push(req.params.id);
  db.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// 6. DELETE /api/books/:id
app.delete('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  db.prepare("UPDATE books SET status = 'off' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Book deleted successfully' });
});

// 7. GET /api/books/:id/reviews
app.get('/api/books/:id/reviews', (req, res) => {
  const { page = '1', pageSize = '10' } = req.query;
  const pageNum = Math.max(1, Number(page));
  const pageSizeNum = Math.max(1, Number(pageSize));
  const offset = (pageNum - 1) * pageSizeNum;

  const bookId = req.params.id;
  const countRow = db.prepare('SELECT COUNT(*) as total FROM reviews WHERE bookId = ?').get(bookId) as { total: number };
  const reviews = db.prepare('SELECT * FROM reviews WHERE bookId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(bookId, pageSizeNum, offset);

  const parsed = reviews.map((r: any) => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : [],
  }));

  res.json({ data: parsed, total: countRow.total, page: pageNum, pageSize: pageSizeNum });
});

// 8. POST /api/books/:id/reviews
app.post('/api/books/:id/reviews', (req, res) => {
  const { userName, rating, content, images } = req.body;

  if (!userName || !rating) {
    res.status(400).json({ error: 'userName and rating are required' });
    return;
  }

  const bookId = Number(req.params.id);
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const imagesJson = JSON.stringify(images || []);
  const result = db.prepare('INSERT INTO reviews (bookId, userName, rating, content, images) VALUES (?, ?, ?, ?, ?)').run(bookId, userName, rating, content || '', imagesJson);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid) as any;
  review.images = JSON.parse(review.images);

  res.status(201).json(review);
});

// 8b. POST /api/upload - Image upload for reviews
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const imageUrl = '/uploads/' + req.file.filename;
  res.json({ url: imageUrl });
});

// 9. GET /api/stats
app.get('/api/stats', (req, res) => {
  const totalStockRow = db.prepare("SELECT COALESCE(SUM(stock), 0) as totalStock FROM books WHERE status = 'on'").get() as { totalStock: number };
  const pendingOrdersRow = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending'").get() as { cnt: number };

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const visits7dRow = db.prepare('SELECT COALESCE(SUM(count), 0) as total FROM visits WHERE date >= ?').get(sevenDaysAgoStr) as { total: number };

  const salesRows = db.prepare(`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM orders
    WHERE DATE(createdAt) >= ?
    GROUP BY DATE(createdAt)
    ORDER BY date
  `).all(sevenDaysAgoStr) as { date: string; count: number }[];

  const salesMap = new Map(salesRows.map(r => [r.date, r.count]));

  const sales7d: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    sales7d.push({ date: dateStr, count: salesMap.get(dateStr) || 0 });
  }

  res.json({
    totalStock: totalStockRow.totalStock,
    pendingOrders: pendingOrdersRow.cnt,
    visits7d: visits7dRow.total,
    sales7d,
  });
});

app.listen(3001, () => {
  console.log('Old Bookstore API server running on http://localhost:3001');
});
