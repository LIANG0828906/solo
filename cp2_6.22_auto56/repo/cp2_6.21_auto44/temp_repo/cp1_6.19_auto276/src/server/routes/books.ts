import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { store } from '../memoryStore';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getPool } from '../db';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  const pool = getPool();
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (e) {}
  res.json([...store.books].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

router.get('/mine', authMiddleware, async (req: AuthRequest, res) => {
  const pool = getPool();
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM books WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
      return res.json(rows);
    }
  } catch (e) {}
  const books = store.books
    .filter(b => b.user_id === req.userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(books);
});

router.post('/', authMiddleware, upload.single('cover'), async (req: AuthRequest, res) => {
  const { title, author, subject, price } = req.body;
  if (!title || !author || !subject || !price) {
    return res.status(400).json({ message: '请填写完整信息' });
  }
  const coverUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const pool = getPool();
  try {
    if (pool) {
      const { rows } = await pool.query(
        'INSERT INTO books (title, author, subject, price, cover_url, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [title, author, subject, price, coverUrl, req.userId]
      );
      return res.json(rows[0]);
    }
  } catch (e) {}

  const newBook = {
    id: store.nextId.books++,
    title,
    author,
    subject,
    price: parseFloat(price),
    cover_url: coverUrl,
    user_id: req.userId!,
    status: 'available' as const,
    created_at: new Date().toISOString(),
  };
  store.books.push(newBook);
  res.json(newBook);
});

router.post('/:id/exchange', authMiddleware, async (req: AuthRequest, res) => {
  const bookId = parseInt(req.params.id);
  const pool = getPool();
  try {
    if (pool) {
      const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
      const book = bookResult.rows[0];
      if (!book) return res.status(404).json({ message: '教材不存在' });
      if (book.user_id === req.userId) return res.status(400).json({ message: '不能交换自己的教材' });
      if (book.status !== 'available') return res.status(400).json({ message: '该教材不可交换' });
      await pool.query("UPDATE books SET status = 'exchanging' WHERE id = $1", [bookId]);
      const { rows } = await pool.query(
        'INSERT INTO exchanges (book_id, requester_id, owner_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [bookId, req.userId, book.user_id, 'pending']
      );
      return res.json({ exchange: rows[0], message: '交换申请已提交' });
    }
  } catch (e) {}

  const book = store.books.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: '教材不存在' });
  if (book.user_id === req.userId) return res.status(400).json({ message: '不能交换自己的教材' });
  if (book.status !== 'available') return res.status(400).json({ message: '该教材不可交换' });

  book.status = 'exchanging';
  const newExchange = {
    id: store.nextId.exchanges++,
    book_id: bookId,
    requester_id: req.userId!,
    owner_id: book.user_id,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
  };
  store.exchanges.push(newExchange);
  res.json({ exchange: newExchange, message: '交换申请已提交' });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const bookId = parseInt(req.params.id);
  const pool = getPool();
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT user_id FROM books WHERE id = $1', [bookId]);
      if (!rows[0]) return res.status(404).json({ message: '教材不存在' });
      if (rows[0].user_id !== req.userId) return res.status(403).json({ message: '无权限' });
      await pool.query('DELETE FROM books WHERE id = $1', [bookId]);
      return res.json({ message: '删除成功' });
    }
  } catch (e) {}

  const idx = store.books.findIndex(b => b.id === bookId);
  if (idx === -1) return res.status(404).json({ message: '教材不存在' });
  if (store.books[idx].user_id !== req.userId) return res.status(403).json({ message: '无权限' });
  store.books.splice(idx, 1);
  res.json({ message: '删除成功' });
});

export default router;
