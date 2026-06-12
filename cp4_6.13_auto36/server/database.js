import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function connectDB() {
  db = new Database(path.join(__dirname, 'finance.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      client_name TEXT NOT NULL,
      rate_type TEXT NOT NULL CHECK(rate_type IN ('hourly', 'fixed')),
      rate_amount REAL NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'paused')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      income_date TEXT NOT NULL,
      amount REAL NOT NULL,
      invoice_number TEXT,
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('received', 'pending', 'overdue')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function queryDB(sql, params = []) {
  if (!db) throw new Error('Database not connected');
  const stmt = db.prepare(sql);
  if (sql.trim().toUpperCase().startsWith('SELECT')) {
    return stmt.all(...params);
  }
  const result = stmt.run(...params);
  if (sql.trim().toUpperCase().startsWith('INSERT')) {
    return { lastInsertRowid: result.lastInsertRowid };
  }
  return result;
}
