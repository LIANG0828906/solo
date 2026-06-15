import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, 'skill_exchange.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  points: number;
  created_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  skill_type: string;
  description: string;
  requirement: string;
  time_slots: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Exchange {
  id: string;
  skill_id: string;
  requester_id: string;
  provider_id: string;
  exchange_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  exchange_id: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  created_at: string;
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      skill_type TEXT NOT NULL,
      description TEXT DEFAULT '',
      requirement TEXT DEFAULT '',
      time_slots TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      exchange_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      points INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (skill_id) REFERENCES skills(id),
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (provider_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exchange_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exchange_id) REFERENCES exchanges(id)
    );
  `);
}

export function getUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getUserByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
}

export function createUser(user: Omit<User, 'created_at'>): User {
  const stmt = db.prepare('INSERT INTO users (id, username, password, avatar, points) VALUES (?, ?, ?, ?, ?)');
  stmt.run(user.id, user.username, user.password, user.avatar, user.points);
  return getUserById(user.id)!;
}

export function updateUserPoints(userId: string, points: number): void {
  db.prepare('UPDATE users SET points = ? WHERE id = ?').run(points, userId);
}

export function getSkillsByUserId(userId: string): Skill[] {
  return db.prepare('SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Skill[];
}

export function getAllSkills(): Skill[] {
  return db.prepare('SELECT * FROM skills WHERE status = ? ORDER BY created_at DESC').all('active') as Skill[];
}

export function getSkillById(id: string): Skill | undefined {
  return db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as Skill | undefined;
}

export function createSkill(skill: Skill): Skill {
  const stmt = db.prepare(`
    INSERT INTO skills (id, user_id, skill_name, skill_type, description, requirement, time_slots, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(skill.id, skill.user_id, skill.skill_name, skill.skill_type, skill.description, skill.requirement, skill.time_slots, skill.status);
  return getSkillById(skill.id)!;
}

export function updateSkill(id: string, updates: Partial<Skill>): Skill | undefined {
  const fields = Object.keys(updates).filter(k => k !== 'id');
  if (fields.length === 0) return getSkillById(id);
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);
  values.push(id);
  
  db.prepare(`UPDATE skills SET ${setClause} WHERE id = ?`).run(...values);
  return getSkillById(id);
}

export function deleteSkill(id: string): void {
  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
}

export function getExchangesByUserId(userId: string): Exchange[] {
  return db.prepare(`
    SELECT * FROM exchanges 
    WHERE requester_id = ? OR provider_id = ? 
    ORDER BY created_at DESC
  `).all(userId, userId) as Exchange[];
}

export function getExchangeById(id: string): Exchange | undefined {
  return db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id) as Exchange | undefined;
}

export function createExchange(exchange: Exchange): Exchange {
  const stmt = db.prepare(`
    INSERT INTO exchanges (id, skill_id, requester_id, provider_id, exchange_time, status, points)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(exchange.id, exchange.skill_id, exchange.requester_id, exchange.provider_id, exchange.exchange_time, exchange.status, exchange.points);
  return getExchangeById(exchange.id)!;
}

export function updateExchangeStatus(id: string, status: string): Exchange | undefined {
  db.prepare('UPDATE exchanges SET status = ? WHERE id = ?').run(status, id);
  return getExchangeById(id);
}

export function createTransaction(transaction: Transaction): Transaction {
  const stmt = db.prepare(`
    INSERT INTO transactions (id, user_id, exchange_id, amount, type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(transaction.id, transaction.user_id, transaction.exchange_id, transaction.amount, transaction.type, transaction.description);
  return transaction;
}

export function getTransactionsByUserId(userId: string): Transaction[] {
  return db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Transaction[];
}

export default db;
