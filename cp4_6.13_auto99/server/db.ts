import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'beantrace.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    origin TEXT NOT NULL,
    variety TEXT NOT NULL,
    processingMethod TEXT NOT NULL,
    roastProfile TEXT NOT NULL,
    greenScore REAL NOT NULL,
    flavorNotes TEXT NOT NULL,
    roastDate TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    flavorProfile TEXT NOT NULL,
    roastLevel TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_batches_userId ON batches(userId);
  CREATE INDEX IF NOT EXISTS idx_batches_origin ON batches(origin);
  CREATE INDEX IF NOT EXISTS idx_batches_roastLevel ON batches(roastLevel);
`);

export default db;
