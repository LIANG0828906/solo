import express = require('express');
import { Request, Response, NextFunction } from 'express';
import cors = require('cors');
import Database = require('better-sqlite3');
import path = require('path');
import { v4 as uuidv4 } from 'uuid';

type BookStatus = 'want_to_read' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  book_id: string;
  excerpt: string;
  reflection: string;
  created_at: string;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbPath = path.join(process.cwd(), 'books.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT,
    total_pages INTEGER NOT NULL DEFAULT 0,
    current_page INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'want_to_read',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    reflection TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );
`);

const seedBooks = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number };
if (seedBooks.count === 0) {
  const insertBook = db.prepare(`
    INSERT INTO books (id, title, author, cover_url, total_pages, current_page, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertNote = db.prepare(`
    INSERT INTO notes (id, book_id, excerpt, reflection)
    VALUES (?, ?, ?, ?)
  `);

  const book1Id = uuidv4();
  const book2Id = uuidv4();
  const book3Id = uuidv4();
  const book4Id = uuidv4();

  insertBook.run(book1Id, '深入理解计算机系统', 'Randal E. Bryant', 'https://images-cn.ssl-images-amazon.cn/images/I/41Bx2i1E7EL._SX398_BO1,204,203,200_.jpg', 730, 320, 'reading');
  insertBook.run(book2Id, '算法导论', 'Thomas H. Cormen', 'https://images-cn.ssl-images-amazon.cn/images/I/51hKH2P6XgL._SX379_BO1,204,203,200_.jpg', 1312, 85, 'want_to_read');
  insertBook.run(book3Id, '代码整洁之道', 'Robert C. Martin', 'https://images-cn.ssl-images-amazon.cn/images/I/51y1Hk8t2xL._SX376_BO1,204,203,200_.jpg', 464, 464, 'finished');
  insertBook.run(book4Id, '重构：改善既有代码的设计', 'Martin Fowler', 'https://images-cn.ssl-images-amazon.cn/images/I/514T8LkU2UL._SX382_BO1,204,203,200_.jpg', 420, 150, 'reading');

  insertNote.run(uuidv4(), book1Id, '存储器层次结构的核心思想是：每一层存储设备都是下一层设备的缓存。', '这让我理解了为什么要关注数据局部性——无论是时间局部性还是空间局部性，它们直接决定了程序的实际运行速度。在写循环时，嵌套顺序真的很重要。');
  insertNote.run(uuidv4(), book1Id, '虚拟内存为每个进程提供了一个独立的地址空间，使得每个进程都认为自己独占主存。', 'VM系统真是操作系统最精妙的设计之一。通过结合DRAM缓存、磁盘和地址翻译硬件，它把内存管理从程序员手里解放出来，同时提供了安全隔离。');
  insertNote.run(uuidv4(), book3Id, '函数应该只做一件事，并且只做好这一件事。', '这句话看似简单，但在实际项目中做到却非常难。当一个函数超过20行时，我就该反思它是不是承担了太多职责。拆分函数的关键在于找到正确的抽象层次。');
  insertNote.run(uuidv4(), book4Id, '重构的第一步是建立可靠的测试机制，确保重构不会改变程序的外部行为。', '测试是重构的安全网。没有测试就重构，无异于在没有安全绳的情况下走钢丝——迟早会掉下去。');
}

app.get('/api/books', (_req: Request, res: Response<Book[]>) => {
  const books = db.prepare('SELECT * FROM books ORDER BY updated_at DESC').all() as Book[];
  res.json(books);
});

app.get('/api/books/:id', (req: Request, res: Response<Book | { error: string }>) => {
  const { id } = req.params;
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!book) {
    return res.status(404).json({ error: 'book not found' });
  }
  res.json(book);
});

app.post('/api/books', (req: Request, res: Response<Book | { error: string }>) => {
  const { title, author, cover_url = null, total_pages = 0, current_page = 0, status = 'want_to_read' } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'title and author are required' });
  }
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO books (id, title, author, cover_url, total_pages, current_page, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, author, cover_url, total_pages, current_page, status);
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book;
  res.status(201).json(book);
});

app.put('/api/books/:id', (req: Request, res: Response<Book | { error: string }>) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'book not found' });
  }
  const {
    title = existing.title,
    author = existing.author,
    cover_url = existing.cover_url,
    total_pages = existing.total_pages,
    current_page = existing.current_page,
    status = existing.status
  } = req.body;
  const stmt = db.prepare(`
    UPDATE books SET title=?, author=?, cover_url=?, total_pages=?, current_page=?, status=?, updated_at=datetime('now')
    WHERE id=?
  `);
  stmt.run(title, author, cover_url, total_pages, current_page, status, id);
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book;
  res.json(book);
});

app.delete('/api/books/:id', (req: Request, res: Response<{ success: boolean; error?: string }>) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!existing) {
    return res.status(404).json({ success: false, error: 'book not found' });
  }
  db.prepare('DELETE FROM books WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get('/api/books/:id/notes', (req: Request, res: Response<Note[] | { error: string }>) => {
  const { id } = req.params;
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!book) {
    return res.status(404).json({ error: 'book not found' } as any);
  }
  const notes = db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC').all(id) as Note[];
  res.json(notes);
});

app.post('/api/books/:id/notes', (req: Request, res: Response<Note | { error: string }>) => {
  const { id } = req.params;
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!book) {
    return res.status(404).json({ error: 'book not found' });
  }
  const { excerpt, reflection } = req.body;
  if (!excerpt || !reflection) {
    return res.status(400).json({ error: 'excerpt and reflection are required' });
  }
  const noteId = uuidv4();
  db.prepare('INSERT INTO notes (id, book_id, excerpt, reflection) VALUES (?, ?, ?, ?)')
    .run(noteId, id, excerpt, reflection);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as Note;
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req: Request, res: Response<{ success: boolean; error?: string }>) => {
  const { id } = req.params;
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
  if (!note) {
    return res.status(404).json({ success: false, error: 'note not found' });
  }
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  res.json({ success: true });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[Server] Tech Books API running on http://localhost:${PORT}`);
  console.log(`[Server] SQLite database: ${dbPath}`);
});
