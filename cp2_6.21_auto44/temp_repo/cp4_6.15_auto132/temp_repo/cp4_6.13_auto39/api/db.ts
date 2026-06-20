import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'workshop.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER NOT NULL DEFAULT 20,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'brainstorm',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_creator INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(idea_id, participant_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  vote_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  assignee_id TEXT NOT NULL REFERENCES participants(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'P3',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ideas_workshop ON ideas(workshop_id);
CREATE INDEX IF NOT EXISTS idx_participants_workshop ON participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_likes_idea ON likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_workshop ON votes(workshop_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workshop ON tasks(workshop_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
`)

export default db
