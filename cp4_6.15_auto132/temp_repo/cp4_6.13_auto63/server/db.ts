import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'bookdrift.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    cover_url TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    max_borrow_days INTEGER NOT NULL DEFAULT 21,
    max_borrow_count INTEGER NOT NULL DEFAULT 10,
    drift_count INTEGER NOT NULL DEFAULT 0,
    avg_rating REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS borrows (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    borrower_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    borrow_date TEXT,
    return_date TEXT,
    rating INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    borrower_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_id);
  CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
  CREATE INDEX IF NOT EXISTS idx_borrows_book ON borrows(book_id);
  CREATE INDEX IF NOT EXISTS idx_borrows_borrower ON borrows(borrower_id);
  CREATE INDEX IF NOT EXISTS idx_borrows_owner ON borrows(owner_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_owner ON reviews(owner_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_borrower ON reviews(borrower_id);
`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, avatar) VALUES (?, ?, ?, ?)
  `);
  const insertBook = db.prepare(`
    INSERT INTO books (id, owner_id, title, author, cover_url, status, max_borrow_days, max_borrow_count, drift_count, avg_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hash1 = bcrypt.hashSync('pass123', 10);
  const hash2 = bcrypt.hashSync('pass123', 10);

  const userId1 = uuidv4();
  const userId2 = uuidv4();

  insertUser.run(userId1, 'user1', hash1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1');
  insertUser.run(userId2, 'user2', hash2, 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2');

  const books = [
    { owner: userId1, title: '三体', author: '刘慈欣', cover: 'https://covers.openlibrary.org/b/id/8773739-L.jpg', status: 'available', drifts: 12, rating: 4.8 },
    { owner: userId1, title: '活着', author: '余华', cover: 'https://covers.openlibrary.org/b/id/8226004-L.jpg', status: 'borrowed', drifts: 8, rating: 4.6 },
    { owner: userId2, title: '百年孤独', author: '加西亚·马尔克斯', cover: 'https://covers.openlibrary.org/b/id/8234654-L.jpg', status: 'available', drifts: 15, rating: 4.9 },
    { owner: userId2, title: '人类简史', author: '尤瓦尔·赫拉利', cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg', status: 'drifting', drifts: 20, rating: 4.7 },
    { owner: userId1, title: '围城', author: '钱钟书', cover: 'https://covers.openlibrary.org/b/id/10909258-L.jpg', status: 'available', drifts: 5, rating: 4.5 },
  ];

  books.forEach(book => {
    insertBook.run(
      uuidv4(),
      book.owner,
      book.title,
      book.author,
      book.cover,
      book.status,
      21,
      10,
      book.drifts,
      book.rating
    );
  });

  console.log('测试数据已插入');
}

export default db;
