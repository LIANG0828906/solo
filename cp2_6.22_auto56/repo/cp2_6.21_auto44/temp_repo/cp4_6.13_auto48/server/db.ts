import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, 'cafe_exchange.db');
let db: SqlJsDatabase;

function rowToObj(row: any[], columns: string[]): any {
  const obj: any = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj;
}

function rowsToObj(rows: any[][], columns: string[]): any[] {
  return rows.map(row => rowToObj(row, columns));
}

export async function initDB(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      status TEXT DEFAULT 'available',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_requests (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (requester_id) REFERENCES users(id)
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_exchange_item_id ON exchange_requests(item_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_exchange_requester_id ON exchange_requests(requester_id)`);

  saveDB();
  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

export function getDB(): SqlJsDatabase {
  return db;
}

export async function createUser(nickname: string, password: string): Promise<any> {
  const id = uuidv4();
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  const avatar_color = `hsl(${hue}, 55%, 55%)`;

  db.run(
    'INSERT INTO users (id, nickname, password, avatar_color) VALUES (?, ?, ?, ?)',
    [id, nickname, password, avatar_color]
  );
  saveDB();

  const stmt = db.prepare('SELECT id, nickname, avatar_color FROM users WHERE id = ?');
  stmt.bind([id]);
  let user: any = null;
  if (stmt.step()) {
    user = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return user;
}

export async function getUserById(id: string): Promise<any> {
  const stmt = db.prepare('SELECT id, nickname, avatar_color FROM users WHERE id = ?');
  stmt.bind([id]);
  let user: any = null;
  if (stmt.step()) {
    user = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return user;
}

export async function getUserByNickname(nickname: string): Promise<any> {
  const stmt = db.prepare('SELECT * FROM users WHERE nickname = ?');
  stmt.bind([nickname]);
  let user: any = null;
  if (stmt.step()) {
    user = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return user;
}

export async function createItem(data: {
  user_id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
}): Promise<any> {
  const id = uuidv4();
  db.run(
    'INSERT INTO items (id, user_id, title, description, category, image) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.user_id, data.title, data.description, data.category, data.image || null]
  );
  saveDB();

  const stmt = db.prepare(
    `SELECT i.*, u.nickname, u.avatar_color 
     FROM items i JOIN users u ON i.user_id = u.id 
     WHERE i.id = ?`
  );
  stmt.bind([id]);
  let item: any = null;
  if (stmt.step()) {
    item = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return item;
}

export async function getAllItems(): Promise<any[]> {
  const stmt = db.prepare(
    `SELECT i.*, u.nickname, u.avatar_color 
     FROM items i JOIN users u ON i.user_id = u.id 
     ORDER BY i.created_at DESC`
  );
  const results: any[] = [];
  while (stmt.step()) {
    results.push(rowToObj(stmt.get(), stmt.getColumnNames()));
  }
  stmt.free();
  return results;
}

export async function getItemById(id: string): Promise<any> {
  const stmt = db.prepare(
    `SELECT i.*, u.nickname, u.avatar_color 
     FROM items i JOIN users u ON i.user_id = u.id 
     WHERE i.id = ?`
  );
  stmt.bind([id]);
  let item: any = null;
  if (stmt.step()) {
    item = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return item;
}

export async function getItemsByUserId(user_id: string): Promise<any[]> {
  const stmt = db.prepare(
    `SELECT i.*, u.nickname, u.avatar_color 
     FROM items i JOIN users u ON i.user_id = u.id 
     WHERE i.user_id = ? 
     ORDER BY i.status ASC, i.created_at DESC`
  );
  stmt.bind([user_id]);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(rowToObj(stmt.get(), stmt.getColumnNames()));
  }
  stmt.free();
  return results;
}

export async function updateItemStatus(id: string, status: string): Promise<any> {
  db.run('UPDATE items SET status = ? WHERE id = ?', [status, id]);
  saveDB();
  return getItemById(id);
}

export async function createExchangeRequest(data: {
  item_id: string;
  requester_id: string;
  message: string;
}): Promise<any> {
  const id = uuidv4();
  db.run(
    'INSERT INTO exchange_requests (id, item_id, requester_id, message) VALUES (?, ?, ?, ?)',
    [id, data.item_id, data.requester_id, data.message]
  );
  saveDB();

  const stmt = db.prepare(
    `SELECT er.*, i.title as item_title, i.user_id as owner_id,
            u1.nickname as requester_nickname, u1.avatar_color as requester_avatar_color,
            u2.nickname as owner_nickname
     FROM exchange_requests er
     JOIN items i ON er.item_id = i.id
     JOIN users u1 ON er.requester_id = u1.id
     JOIN users u2 ON i.user_id = u2.id
     WHERE er.id = ?`
  );
  stmt.bind([id]);
  let req: any = null;
  if (stmt.step()) {
    req = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return req;
}

export async function getExchangeRequestsByUser(user_id: string): Promise<any[]> {
  const stmt = db.prepare(
    `SELECT er.*, i.title as item_title, i.user_id as owner_id, i.status as item_status,
            u1.nickname as requester_nickname, u1.avatar_color as requester_avatar_color,
            u2.nickname as owner_nickname
     FROM exchange_requests er
     JOIN items i ON er.item_id = i.id
     JOIN users u1 ON er.requester_id = u1.id
     JOIN users u2 ON i.user_id = u2.id
     WHERE i.user_id = ?
     ORDER BY er.created_at DESC`
  );
  stmt.bind([user_id]);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(rowToObj(stmt.get(), stmt.getColumnNames()));
  }
  stmt.free();
  return results;
}

export async function getExchangeRequestsByRequester(requester_id: string): Promise<any[]> {
  const stmt = db.prepare(
    `SELECT er.*, i.title as item_title, i.status as item_status,
            u.nickname as requester_nickname
     FROM exchange_requests er
     JOIN items i ON er.item_id = i.id
     JOIN users u ON er.requester_id = u.id
     WHERE er.requester_id = ?
     ORDER BY er.created_at DESC`
  );
  stmt.bind([requester_id]);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(rowToObj(stmt.get(), stmt.getColumnNames()));
  }
  stmt.free();
  return results;
}

export async function updateExchangeRequestStatus(id: string, status: string): Promise<any> {
  db.run('UPDATE exchange_requests SET status = ? WHERE id = ?', [status, id]);

  if (status === 'accepted') {
    const stmt = db.prepare('SELECT item_id FROM exchange_requests WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = rowToObj(stmt.get(), stmt.getColumnNames());
      db.run('UPDATE items SET status = ? WHERE id = ?', ['exchanged', row.item_id]);
    }
    stmt.free();
  }

  saveDB();

  const stmt = db.prepare(
    `SELECT er.*, i.title as item_title, i.user_id as owner_id, i.status as item_status,
            u1.nickname as requester_nickname, u1.avatar_color as requester_avatar_color
     FROM exchange_requests er
     JOIN items i ON er.item_id = i.id
     JOIN users u1 ON er.requester_id = u1.id
     WHERE er.id = ?`
  );
  stmt.bind([id]);
  let updated: any = null;
  if (stmt.step()) {
    updated = rowToObj(stmt.get(), stmt.getColumnNames());
  }
  stmt.free();
  return updated;
}
