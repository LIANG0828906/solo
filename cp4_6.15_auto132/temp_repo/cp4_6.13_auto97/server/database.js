import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'library.db');

let db;
let saveTimeout;

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveDb, 300);
}

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      isbn TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      registration_date TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      borrow_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      fine REAL NOT NULL DEFAULT 0,
      fine_paid INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (book_id) REFERENCES books(isbn)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      reserve_date TEXT NOT NULL,
      expire_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (book_id) REFERENCES books(isbn)
    )
  `);

  const bookCount = queryVal('SELECT COUNT(*) as count FROM books');
  if (bookCount === 0) {
    const books = [
      { isbn: '978-7-020-00220-1', title: '红楼梦', author: '曹雪芹', category: '小说', total: 5, available: 3 },
      { isbn: '978-7-020-00875-3', title: '三国演义', author: '罗贯中', category: '小说', total: 4, available: 2 },
      { isbn: '978-7-020-00870-8', title: '水浒传', author: '施耐庵', category: '小说', total: 3, available: 1 },
      { isbn: '978-7-020-00871-5', title: '西游记', author: '吴承恩', category: '小说', total: 4, available: 4 },
      { isbn: '978-7-111-40701-0', title: '算法导论', author: 'Thomas H. Cormen', category: '科技', total: 3, available: 2 },
      { isbn: '978-7-115-47593-8', title: 'JavaScript高级程序设计', author: 'Matt Frisbie', category: '科技', total: 6, available: 4 },
      { isbn: '978-7-302-44648-3', title: '数据结构', author: '严蔚敏', category: '科技', total: 5, available: 3 },
      { isbn: '978-7-508-35390-0', title: '人类简史', author: '尤瓦尔·赫拉利', category: '历史', total: 4, available: 2 },
      { isbn: '978-7-508-65389-5', title: '枪炮、病菌与钢铁', author: '贾雷德·戴蒙德', category: '历史', total: 3, available: 3 },
      { isbn: '978-7-108-00921-3', title: '万历十五年', author: '黄仁宇', category: '历史', total: 4, available: 1 },
      { isbn: '978-7-559-43527-5', title: '艺术的故事', author: '贡布里希', category: '艺术', total: 3, available: 2 },
      { isbn: '978-7-544-26750-8', title: '美的历程', author: '李泽厚', category: '艺术', total: 4, available: 3 },
      { isbn: '978-7-532-73807-0', title: '百年孤独', author: '加西亚·马尔克斯', category: '小说', total: 5, available: 5 },
      { isbn: '978-7-115-51066-0', title: 'React设计原理', author: '卡颂', category: '科技', total: 3, available: 1 },
      { isbn: '978-7-544-27095-9', title: '中国美术五千年', author: '杨琪', category: '艺术', total: 2, available: 0 },
      { isbn: '978-7-505-73407-2', title: '全球通史', author: '斯塔夫里阿诺斯', category: '历史', total: 3, available: 2 },
    ];

    for (const b of books) {
      db.run('INSERT INTO books (isbn, title, author, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)',
        [b.isbn, b.title, b.author, b.category, b.total, b.available]);
    }

    const hash = bcrypt.hashSync('123456', 10);
    db.run('INSERT INTO members (id, name, email, password_hash, registration_date, points) VALUES (?, ?, ?, ?, ?, ?)',
      ['M001', '张三', 'zhangsan@library.com', hash, '2024-01-15', 60]);
    db.run('INSERT INTO members (id, name, email, password_hash, registration_date, points) VALUES (?, ?, ?, ?, ?, ?)',
      ['M002', '李四', 'lisi@library.com', hash, '2024-02-20', 30]);
    db.run('INSERT INTO members (id, name, email, password_hash, registration_date, points) VALUES (?, ?, ?, ?, ?, ?)',
      ['M003', '王五', 'wangwu@library.com', hash, '2024-03-10', 90]);
    db.run('INSERT INTO members (id, name, email, password_hash, registration_date, points) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', '管理员', 'admin@library.com', hash, '2024-01-01', 0]);

    db.run('INSERT INTO borrow_records (id, member_id, book_id, borrow_date, due_date, return_date, fine, fine_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['B001', 'M001', '978-7-020-00220-1', '2024-06-01', '2024-06-15', '2024-06-14', 0, 0]);
    db.run('INSERT INTO borrow_records (id, member_id, book_id, borrow_date, due_date, return_date, fine, fine_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['B002', 'M001', '978-7-111-40701-0', '2024-06-10', '2024-06-24', '2024-06-28', 2.0, 0]);
    db.run('INSERT INTO borrow_records (id, member_id, book_id, borrow_date, due_date, return_date, fine, fine_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['B003', 'M002', '978-7-020-00875-3', '2024-07-01', '2024-07-15', null, 0, 0]);
    db.run('INSERT INTO borrow_records (id, member_id, book_id, borrow_date, due_date, return_date, fine, fine_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['B004', 'M003', '978-7-508-35390-0', '2024-07-05', '2024-07-19', '2024-07-25', 3.0, 0]);
    db.run('INSERT INTO borrow_records (id, member_id, book_id, borrow_date, due_date, return_date, fine, fine_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['B005', 'M001', '978-7-115-47593-8', '2024-08-01', '2024-08-15', null, 0, 0]);

    saveDb();
  }

  return db;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function queryVal(sql, params = []) {
  const row = queryOne(sql, params);
  return row ? Object.values(row)[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  scheduleSave();
  return { changes: db.getRowsModified() };
}

export { initDatabase, queryAll, queryOne, queryVal, run, saveDb };
