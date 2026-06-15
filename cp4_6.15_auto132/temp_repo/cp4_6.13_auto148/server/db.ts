import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'ideas.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    voter_name TEXT NOT NULL,
    room_code TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(idea_id, voter_name, room_code)
  );

  CREATE INDEX IF NOT EXISTS idx_ideas_room ON ideas(room_code);
  CREATE INDEX IF NOT EXISTS idx_ideas_created ON ideas(created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_idea ON comments(idea_id);
  CREATE INDEX IF NOT EXISTS idx_votes_idea ON votes(idea_id);
  CREATE INDEX IF NOT EXISTS idx_votes_room ON votes(room_code);
`);

export default db;
