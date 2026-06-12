import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../authMiddleware';

const router = Router();

router.post('/books/:id/reviews', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const bookId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: '评分必须在1-5之间' });
      return;
    }

    const book: any = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) {
      res.status(404).json({ error: '书籍不存在' });
      return;
    }

    const borrow: any = db.prepare(`
      SELECT * FROM borrows 
      WHERE book_id = ? AND borrower_id = ? AND status = 'returned'
      ORDER BY id DESC LIMIT 1
    `).get(bookId, req.user.id);

    if (!borrow) {
      res.status(400).json({ error: '只有借阅并归还过的用户才能评价' });
      return;
    }

    const existingReview = db.prepare(`
      SELECT id FROM reviews WHERE book_id = ? AND borrower_id = ?
    `).get(bookId, req.user.id);

    if (existingReview) {
      res.status(400).json({ error: '您已经评价过这本书' });
      return;
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO reviews (id, book_id, borrower_id, owner_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, bookId, req.user.id, book.owner_id, rating, comment || null);

    const reviewStats: any = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg_rating
      FROM reviews WHERE book_id = ?
    `).get(bookId);

    const borrowCount = db.prepare(`
      SELECT COUNT(DISTINCT borrower_id) as drift_count
      FROM borrows WHERE book_id = ? AND status = 'returned'
    `).get(bookId) as { drift_count: number };

    db.prepare(`
      UPDATE books SET avg_rating = ?, drift_count = ? WHERE id = ?
    `).run(reviewStats.avg_rating, borrowCount.drift_count, bookId);

    const review = db.prepare(`
      SELECT r.*,
        b.title as book_title,
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM reviews r
      LEFT JOIN books b ON r.book_id = b.id
      LEFT JOIN users borrower ON r.borrower_id = borrower.id
      LEFT JOIN users owner ON r.owner_id = owner.id
      WHERE r.id = ?
    `).get(id);

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建评价失败' });
  }
});

router.get('/users/:id/reviews', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const reviews = db.prepare(`
      SELECT r.*,
        b.title as book_title,
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM reviews r
      LEFT JOIN books b ON r.book_id = b.id
      LEFT JOIN users borrower ON r.borrower_id = borrower.id
      LEFT JOIN users owner ON r.owner_id = owner.id
      WHERE r.owner_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(id);

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取评价失败' });
  }
});

router.get('/books/:id/reviews', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(id);
    if (!book) {
      res.status(404).json({ error: '书籍不存在' });
      return;
    }

    const reviews = db.prepare(`
      SELECT r.*,
        b.title as book_title,
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM reviews r
      LEFT JOIN books b ON r.book_id = b.id
      LEFT JOIN users borrower ON r.borrower_id = borrower.id
      LEFT JOIN users owner ON r.owner_id = owner.id
      WHERE r.book_id = ?
      ORDER BY r.created_at DESC
    `).all(id);

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取书籍评价失败' });
  }
});

router.get('/users/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const user: any = db.prepare(`
      SELECT id, username, avatar, created_at FROM users WHERE id = ?
    `).get(id);

    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const bookCount = db.prepare('SELECT COUNT(*) as count FROM books WHERE owner_id = ?').get(id) as { count: number };
    const reviewStats: any = db.prepare(`
      SELECT COUNT(*) as review_count, COALESCE(AVG(rating), 0) as avg_rating
      FROM reviews WHERE owner_id = ?
    `).get(id);

    const borrowStats: any = db.prepare(`
      SELECT COUNT(*) as total_borrows
      FROM borrows WHERE owner_id = ?
    `).get(id);

    res.json({
      ...user,
      book_count: bookCount.count,
      review_count: reviewStats.review_count,
      avg_rating: reviewStats.avg_rating,
      total_borrows: borrowStats.total_borrows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;
