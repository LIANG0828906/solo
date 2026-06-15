import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../authMiddleware';

const router = Router();

interface BookQuery {
  search?: string;
  minRating?: string;
  maxRating?: string;
  minDrifts?: string;
  maxDrifts?: string;
  page?: string;
  pageSize?: string;
  ownerId?: string;
}

router.get('/', (req: Request<{}, {}, {}, BookQuery>, res: Response): void => {
  try {
    const { search, minRating, maxRating, minDrifts, maxDrifts, page, pageSize, ownerId } = req.query;

    let sql = 'SELECT b.*, u.username as owner_name, u.avatar as owner_avatar FROM books b LEFT JOIN users u ON b.owner_id = u.id WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (b.title LIKE ? OR b.author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (minRating !== undefined) {
      sql += ' AND b.avg_rating >= ?';
      params.push(Number(minRating));
    }
    if (maxRating !== undefined) {
      sql += ' AND b.avg_rating <= ?';
      params.push(Number(maxRating));
    }
    if (minDrifts !== undefined) {
      sql += ' AND b.drift_count >= ?';
      params.push(Number(minDrifts));
    }
    if (maxDrifts !== undefined) {
      sql += ' AND b.drift_count <= ?';
      params.push(Number(maxDrifts));
    }
    if (ownerId) {
      sql += ' AND b.owner_id = ?';
      params.push(ownerId);
    }

    sql += ' ORDER BY b.created_at DESC';

    const p = page ? parseInt(page as string) : 1;
    const ps = pageSize ? parseInt(pageSize as string) : 10;
    const offset = (p - 1) * ps;

    const countSql = sql.replace('SELECT b.*, u.username as owner_name, u.avatar as owner_avatar FROM books b LEFT JOIN users u ON b.owner_id = u.id', 'SELECT COUNT(*) as total FROM books b LEFT JOIN users u ON b.owner_id = u.id');
    const { total } = db.prepare(countSql).get(...params) as { total: number };

    sql += ' LIMIT ? OFFSET ?';
    params.push(ps, offset);

    const books = db.prepare(sql).all(...params);

    res.json({
      data: books,
      pagination: {
        page: p,
        pageSize: ps,
        total,
        totalPages: Math.ceil(total / ps)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取书籍列表失败' });
  }
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { title, author, cover_url, max_borrow_days, max_borrow_count } = req.body;

    if (!title) {
      res.status(400).json({ error: '书名不能为空' });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO books (id, owner_id, title, author, cover_url, status, max_borrow_days, max_borrow_count, drift_count, avg_rating, created_at)
      VALUES (?, ?, ?, ?, ?, 'available', ?, ?, 0, 0, ?)
    `).run(
      id,
      req.user.id,
      title,
      author || null,
      cover_url || null,
      max_borrow_days || 21,
      max_borrow_count || 10,
      now
    );

    const book = db.prepare('SELECT b.*, u.username as owner_name, u.avatar as owner_avatar FROM books b LEFT JOIN users u ON b.owner_id = u.id WHERE b.id = ?').get(id);

    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建书籍失败' });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const book: any = db.prepare(`
      SELECT b.*, u.username as owner_name, u.avatar as owner_avatar
      FROM books b
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE b.id = ?
    `).get(id);

    if (!book) {
      res.status(404).json({ error: '书籍不存在' });
      return;
    }

    const borrowLogs = db.prepare(`
      SELECT br.*, 
        borrower.username as borrower_name, 
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar,
        b.title as book_title,
        b.cover_url as book_cover
      FROM borrows br
      LEFT JOIN users borrower ON br.borrower_id = borrower.id
      LEFT JOIN users owner ON br.owner_id = owner.id
      LEFT JOIN books b ON br.book_id = b.id
      WHERE br.book_id = ?
      ORDER BY br.borrow_date DESC, br.id DESC
    `).all(id);

    res.json({ ...book, borrow_logs: borrowLogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取书籍详情失败' });
  }
});

router.patch('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const book: any = db.prepare('SELECT * FROM books WHERE id = ?').get(id);

    if (!book) {
      res.status(404).json({ error: '书籍不存在' });
      return;
    }

    if (book.owner_id !== req.user.id) {
      res.status(403).json({ error: '只有书籍主人可以更新' });
      return;
    }

    const { title, author, cover_url, status, max_borrow_days, max_borrow_count } = req.body;

    const allowedStatus = ['available', 'borrowed', 'drifting'];
    if (status && !allowedStatus.includes(status)) {
      res.status(400).json({ error: '无效的状态值' });
      return;
    }

    db.prepare(`
      UPDATE books SET
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        cover_url = COALESCE(?, cover_url),
        status = COALESCE(?, status),
        max_borrow_days = COALESCE(?, max_borrow_days),
        max_borrow_count = COALESCE(?, max_borrow_count)
      WHERE id = ?
    `).run(
      title || null,
      author !== undefined ? author : null,
      cover_url !== undefined ? cover_url : null,
      status || null,
      max_borrow_days || null,
      max_borrow_count || null,
      id
    );

    const updated = db.prepare('SELECT b.*, u.username as owner_name, u.avatar as owner_avatar FROM books b LEFT JOIN users u ON b.owner_id = u.id WHERE b.id = ?').get(id);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新书籍失败' });
  }
});

export default router;
