import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../authMiddleware';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { book_id, duration_days, reason } = req.body;

    if (!book_id || !duration_days) {
      res.status(400).json({ error: '书籍ID和借阅天数不能为空' });
      return;
    }

    if (duration_days < 1) {
      res.status(400).json({ error: '借阅天数必须大于0' });
      return;
    }

    const book: any = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
    if (!book) {
      res.status(404).json({ error: '书籍不存在' });
      return;
    }

    if (book.owner_id === req.user.id) {
      res.status(400).json({ error: '不能借阅自己的书' });
      return;
    }

    if (book.status !== 'available') {
      res.status(400).json({ error: '该书当前不可借阅' });
      return;
    }

    const pendingBorrow = db.prepare(`
      SELECT id FROM borrows WHERE book_id = ? AND borrower_id = ? AND status = 'pending'
    `).get(book_id, req.user.id);

    if (pendingBorrow) {
      res.status(400).json({ error: '您已有该书的待处理借阅请求' });
      return;
    }

    if (duration_days > book.max_borrow_days) {
      res.status(400).json({ error: `借阅天数不能超过${book.max_borrow_days}天` });
      return;
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO borrows (id, book_id, borrower_id, owner_id, duration_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, book_id, req.user.id, book.owner_id, duration_days, reason || null);

    const borrow = db.prepare(`
      SELECT br.*, 
        b.title as book_title, 
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users borrower ON br.borrower_id = borrower.id
      LEFT JOIN users owner ON br.owner_id = owner.id
      WHERE br.id = ?
    `).get(id);

    res.status(201).json(borrow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建借阅请求失败' });
  }
});

router.patch('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: '操作类型必须是 approve 或 reject' });
      return;
    }

    const borrow: any = db.prepare('SELECT * FROM borrows WHERE id = ?').get(id);
    if (!borrow) {
      res.status(404).json({ error: '借阅请求不存在' });
      return;
    }

    if (borrow.owner_id !== req.user.id) {
      res.status(403).json({ error: '只有书籍主人可以处理此请求' });
      return;
    }

    if (borrow.status !== 'pending') {
      res.status(400).json({ error: '该请求状态不是待处理' });
      return;
    }

    if (action === 'approve') {
      const book: any = db.prepare('SELECT * FROM books WHERE id = ?').get(borrow.book_id);
      if (book.status !== 'available') {
        res.status(400).json({ error: '该书当前不可借阅' });
        return;
      }

      const borrowDate = new Date().toISOString();
      db.prepare(`
        UPDATE borrows SET status = 'approved', borrow_date = ? WHERE id = ?
      `).run(borrowDate, id);

      db.prepare(`
        UPDATE books SET status = 'drifting' WHERE id = ?
      `).run(borrow.book_id);
    } else {
      db.prepare(`
        UPDATE borrows SET status = 'rejected' WHERE id = ?
      `).run(id);
    }

    const updated = db.prepare(`
      SELECT br.*, 
        b.title as book_title, 
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users borrower ON br.borrower_id = borrower.id
      LEFT JOIN users owner ON br.owner_id = owner.id
      WHERE br.id = ?
    `).get(id);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '处理借阅请求失败' });
  }
});

router.post('/:id/return', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const { rating } = req.body;

    const borrow: any = db.prepare('SELECT * FROM borrows WHERE id = ?').get(id);
    if (!borrow) {
      res.status(404).json({ error: '借阅记录不存在' });
      return;
    }

    if (borrow.borrower_id !== req.user.id) {
      res.status(403).json({ error: '只有借阅者可以归还' });
      return;
    }

    if (borrow.status !== 'approved') {
      res.status(400).json({ error: '该借阅状态不支持归还' });
      return;
    }

    const returnDate = new Date().toISOString();
    const ratingValue = rating ? Math.max(0, Math.min(5, Number(rating))) : 0;

    db.prepare(`
      UPDATE borrows SET status = 'returned', return_date = ?, rating = ? WHERE id = ?
    `).run(returnDate, ratingValue, id);

    db.prepare(`
      UPDATE books SET status = 'available' WHERE id = ?
    `).run(borrow.book_id);

    const updated = db.prepare(`
      SELECT br.*, 
        b.title as book_title, 
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users borrower ON br.borrower_id = borrower.id
      LEFT JOIN users owner ON br.owner_id = owner.id
      WHERE br.id = ?
    `).get(id);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '归还失败' });
  }
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { role } = req.query;
    let sql = `
      SELECT br.*, 
        b.title as book_title, 
        b.cover_url as book_cover,
        borrower.username as borrower_name,
        borrower.avatar as borrower_avatar,
        owner.username as owner_name,
        owner.avatar as owner_avatar
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users borrower ON br.borrower_id = borrower.id
      LEFT JOIN users owner ON br.owner_id = owner.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role === 'owner') {
      sql += ' AND br.owner_id = ?';
      params.push(req.user.id);
    } else if (role === 'borrower') {
      sql += ' AND br.borrower_id = ?';
      params.push(req.user.id);
    } else {
      sql += ' AND (br.owner_id = ? OR br.borrower_id = ?)';
      params.push(req.user.id, req.user.id);
    }

    sql += ' ORDER BY br.id DESC';
    const borrows = db.prepare(sql).all(...params);

    res.json(borrows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取借阅记录失败' });
  }
});

export default router;
