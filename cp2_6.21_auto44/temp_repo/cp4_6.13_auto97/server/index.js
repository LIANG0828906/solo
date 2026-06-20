import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDatabase, queryAll, queryOne, queryVal, run } from './database.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'library-smart-system-secret-key';

app.use(cors());
app.use(express.json());

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '令牌无效' });
  }
};

app.get('/api/books', (req, res) => {
  const { search, category } = req.query;
  let sql = 'SELECT * FROM books WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY title';
  const books = queryAll(sql, params);
  res.json(books);
});

app.get('/api/books/:isbn', (req, res) => {
  const book = queryOne('SELECT * FROM books WHERE isbn = ?', [req.params.isbn]);
  if (!book) return res.status(404).json({ error: '图书未找到' });
  res.json(book);
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  const existing = queryOne('SELECT id FROM members WHERE email = ?', [email]);
  if (existing) return res.status(400).json({ error: '该邮箱已注册' });

  const id = 'M' + uuidv4().slice(0, 6).toUpperCase();
  const password_hash = bcrypt.hashSync(password, 10);
  const registration_date = new Date().toISOString().split('T')[0];

  try {
    run('INSERT INTO members (id, name, email, password_hash, registration_date, points) VALUES (?, ?, ?, ?, ?, 0)',
      [id, name, email, password_hash, registration_date]);
    const token = jwt.sign({ id, name, email, role: 'member' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, member: { id, name, email, registration_date, points: 0 } });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '请输入邮箱和密码' });

  const member = queryOne('SELECT * FROM members WHERE email = ?', [email]);
  if (!member) return res.status(400).json({ error: '用户不存在' });

  const valid = bcrypt.compareSync(password, member.password_hash);
  if (!valid) return res.status(400).json({ error: '密码错误' });

  const role = member.id === 'admin' ? 'admin' : 'member';
  const token = jwt.sign({ id: member.id, name: member.name, email: member.email, role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    member: { id: member.id, name: member.name, email: member.email, registration_date: member.registration_date, points: member.points, role }
  });
});

app.get('/api/member/:id', authenticate, (req, res) => {
  const member = queryOne('SELECT id, name, email, registration_date, points FROM members WHERE id = ?', [req.params.id]);
  if (!member) return res.status(404).json({ error: '会员未找到' });
  res.json(member);
});

app.get('/api/member/:id/records', authenticate, (req, res) => {
  const records = queryAll(`
    SELECT br.id, br.member_id, br.book_id, br.borrow_date, br.due_date, br.return_date, br.fine, br.fine_paid,
           b.title, b.author, b.category
    FROM borrow_records br
    JOIN books b ON br.book_id = b.isbn
    WHERE br.member_id = ?
    ORDER BY br.borrow_date DESC
  `, [req.params.id]);
  res.json(records);
});

app.get('/api/member/:id/fines', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const records = queryAll(`
    SELECT br.id, br.member_id, br.book_id, br.borrow_date, br.due_date, br.return_date, br.fine, br.fine_paid,
           b.title, b.author, b.category
    FROM borrow_records br
    JOIN books b ON br.book_id = b.isbn
    WHERE br.member_id = ? AND (br.fine > 0 AND br.fine_paid = 0 OR br.return_date IS NULL)
    ORDER BY br.borrow_date DESC
  `, [req.params.id]);

  const updatedRecords = records.map(r => {
    if (!r.return_date) {
      const dueDate = new Date(r.due_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        const fine = diffDays * 0.5;
        return { ...r, fine, overdue_days: diffDays, status: 'overdue' };
      }
      return { ...r, overdue_days: 0, status: 'borrowing' };
    }
    return { ...r, status: r.fine > 0 ? 'fined' : 'returned' };
  });

  const totalFine = updatedRecords.reduce((sum, r) => sum + (r.fine_paid ? 0 : r.fine || 0), 0);
  res.json({ records: updatedRecords, totalFine });
});

app.post('/api/borrow', authenticate, (req, res) => {
  const { member_id, book_id } = req.body;
  if (!member_id || !book_id) return res.status(400).json({ error: '请提供会员ID和图书ISBN' });

  const book = queryOne('SELECT * FROM books WHERE isbn = ?', [book_id]);
  if (!book) return res.status(404).json({ error: '图书未找到' });
  if (book.available_copies <= 0) return res.status(400).json({ error: '该图书暂无可借副本' });

  const member = queryOne('SELECT * FROM members WHERE id = ?', [member_id]);
  if (!member) return res.status(404).json({ error: '会员未找到' });

  const activeCount = queryVal('SELECT COUNT(*) as count FROM borrow_records WHERE member_id = ? AND return_date IS NULL', [member_id]);
  const maxBorrows = member.points >= 100 ? 10 : 5;
  if (activeCount >= maxBorrows) {
    return res.status(400).json({ error: `借阅已达上限(${maxBorrows}本)，请先归还` });
  }

  const id = 'B' + uuidv4().slice(0, 6).toUpperCase();
  const borrowDate = new Date();
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + 14);

  try {
    run('INSERT INTO borrow_records (id, member_id, book_id, borrow_date, due_date) VALUES (?, ?, ?, ?, ?)',
      [id, member_id, book_id, borrowDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0]]);
    run('UPDATE books SET available_copies = available_copies - 1 WHERE isbn = ?', [book_id]);
    res.json({ success: true, record: { id, borrow_date: borrowDate.toISOString().split('T')[0], due_date: dueDate.toISOString().split('T')[0] } });
  } catch (err) {
    res.status(500).json({ error: '借阅登记失败' });
  }
});

app.post('/api/return', authenticate, (req, res) => {
  const { member_id, book_id } = req.body;
  if (!member_id || !book_id) return res.status(400).json({ error: '请提供会员ID和图书ISBN' });

  const record = queryOne('SELECT * FROM borrow_records WHERE member_id = ? AND book_id = ? AND return_date IS NULL',
    [member_id, book_id]);
  if (!record) return res.status(404).json({ error: '未找到该借阅记录' });

  const returnDate = new Date();
  const dueDate = new Date(record.due_date);
  const diffDays = Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const fine = diffDays > 0 ? diffDays * 0.5 : 0;

  try {
    run('UPDATE borrow_records SET return_date = ?, fine = ? WHERE id = ?',
      [returnDate.toISOString().split('T')[0], fine, record.id]);
    run('UPDATE books SET available_copies = available_copies + 1 WHERE isbn = ?', [book_id]);
    run('UPDATE members SET points = points + 10 WHERE id = ?', [member_id]);
    res.json({ success: true, fine, overdue_days: diffDays > 0 ? diffDays : 0 });
  } catch (err) {
    res.status(500).json({ error: '归还登记失败' });
  }
});

app.post('/api/reserve', authenticate, (req, res) => {
  const { member_id, book_id } = req.body;
  if (!member_id || !book_id) return res.status(400).json({ error: '请提供会员ID和图书ISBN' });

  const book = queryOne('SELECT * FROM books WHERE isbn = ?', [book_id]);
  if (!book) return res.status(404).json({ error: '图书未找到' });
  if (book.available_copies <= 0) return res.status(400).json({ error: '该图书暂无可借副本' });

  const existingReservation = queryOne('SELECT * FROM reservations WHERE member_id = ? AND book_id = ? AND status = ?',
    [member_id, book_id, 'active']);
  if (existingReservation) return res.status(400).json({ error: '您已预约过此书' });

  const id = 'R' + uuidv4().slice(0, 6).toUpperCase();
  const now = new Date();
  const expireDate = new Date(now);
  expireDate.setHours(expireDate.getHours() + 24);

  try {
    run('INSERT INTO reservations (id, member_id, book_id, reserve_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, member_id, book_id, now.toISOString(), expireDate.toISOString(), 'active']);
    run('UPDATE books SET available_copies = available_copies - 1 WHERE isbn = ? AND available_copies > 0', [book_id]);
    res.json({ success: true, reservation: { id, expire_date: expireDate.toISOString() } });
  } catch (err) {
    res.status(500).json({ error: '预约失败' });
  }
});

app.get('/api/reservations/:memberId', authenticate, (req, res) => {
  const reservations = queryAll(`
    SELECT r.id, r.member_id, r.book_id, r.reserve_date, r.expire_date, r.status,
           b.title, b.author, b.category
    FROM reservations r
    JOIN books b ON r.book_id = b.isbn
    WHERE r.member_id = ? AND r.status = 'active'
    ORDER BY r.reserve_date DESC
  `, [req.params.memberId]);
  res.json(reservations);
});

app.post('/api/pay-fines', authenticate, (req, res) => {
  const { member_id, record_ids } = req.body;
  if (!member_id || !record_ids || !record_ids.length) return res.status(400).json({ error: '参数不完整' });

  try {
    for (const rid of record_ids) {
      run('UPDATE borrow_records SET fine_paid = 1 WHERE id = ? AND member_id = ?', [rid, member_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '缴费失败' });
  }
});

app.get('/api/stats/weekly', authenticate, (req, res) => {
  const stats = queryAll(`
    SELECT 
      strftime('%Y-%W', borrow_date) as week,
      COUNT(*) as borrow_count,
      COUNT(DISTINCT member_id) as active_members
    FROM borrow_records
    GROUP BY strftime('%Y-%W', borrow_date)
    ORDER BY week DESC
    LIMIT 12
  `);
  res.json(stats);
});

app.get('/api/members', authenticate, (req, res) => {
  const members = queryAll(`
    SELECT m.id, m.name, m.email, m.registration_date, m.points
    FROM members m
    WHERE m.id != 'admin'
    ORDER BY m.registration_date DESC
  `);

  const result = members.map(m => {
    const totalBorrows = queryVal('SELECT COUNT(*) as count FROM borrow_records WHERE member_id = ?', [m.id]);
    const activeBorrows = queryVal('SELECT COUNT(*) as count FROM borrow_records WHERE member_id = ? AND return_date IS NULL', [m.id]);
    return { ...m, total_borrows: totalBorrows, active_borrows: activeBorrows };
  });

  res.json(result);
});

app.post('/api/admin/add-book', authenticate, (req, res) => {
  const { isbn, title, author, category, total_copies } = req.body;
  if (!isbn || !title || !author || !category || !total_copies) {
    return res.status(400).json({ error: '请填写所有图书信息' });
  }
  try {
    run('INSERT INTO books (isbn, title, author, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)',
      [isbn, title, author, category, total_copies, total_copies]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: '图书ISBN已存在' });
  }
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`📚 智能图书借阅系统服务已启动，端口: ${PORT}`);
  });
}

start();
