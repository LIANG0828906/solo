import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'shotboard.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      userId TEXT NOT NULL,
      lastEditedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shots (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      shotIndex INTEGER NOT NULL,
      duration REAL NOT NULL DEFAULT 1.0,
      description TEXT DEFAULT '',
      imageUrl TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    CREATE INDEX IF NOT EXISTS idx_shots_project ON shots(projectId);
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(userId);
  `);
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  lastEditedAt: string;
  createdAt: string;
}

export interface Shot {
  id: string;
  projectId: string;
  shotIndex: number;
  duration: number;
  description: string;
  imageUrl: string | null;
  createdAt: string;
}

export const userQueries = {
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findById: db.prepare('SELECT id, email, createdAt FROM users WHERE id = ?'),
  create: db.prepare('INSERT INTO users (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)'),
};

export const projectQueries = {
  findByUserId: db.prepare('SELECT * FROM projects WHERE userId = ? ORDER BY lastEditedAt DESC'),
  findById: db.prepare('SELECT * FROM projects WHERE id = ? AND userId = ?'),
  create: db.prepare('INSERT INTO projects (id, name, userId, lastEditedAt, createdAt) VALUES (?, ?, ?, ?, ?)'),
  updateLastEdited: db.prepare('UPDATE projects SET lastEditedAt = ? WHERE id = ?'),
  delete: db.prepare('DELETE FROM projects WHERE id = ? AND userId = ?'),
};

export const shotQueries = {
  findByProjectId: db.prepare('SELECT * FROM shots WHERE projectId = ? ORDER BY shotIndex ASC'),
  findById: db.prepare('SELECT * FROM shots WHERE id = ?'),
  findByIdAndProject: db.prepare(`
    SELECT s.* FROM shots s
    INNER JOIN projects p ON s.projectId = p.id
    WHERE s.id = ? AND p.userId = ?
  `),
  create: db.prepare(`
    INSERT INTO shots (id, projectId, shotIndex, duration, description, imageUrl, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE shots SET duration = ?, description = ?, imageUrl = ? WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM shots WHERE id = ?'),
  getMaxIndex: db.prepare('SELECT COALESCE(MAX(shotIndex), -1) as maxIndex FROM shots WHERE projectId = ?'),
  updateIndex: db.prepare('UPDATE shots SET shotIndex = ? WHERE id = ?'),
  deleteByProjectId: db.prepare('DELETE FROM shots WHERE projectId = ?'),
};

export default db;
