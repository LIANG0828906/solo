import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'database.db');
const dataDir = path.join(__dirname, '..', 'data');

let db: any = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  initializeDefaultData();

  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS timer_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_running INTEGER DEFAULT 0,
      current_task TEXT DEFAULT '',
      client_id TEXT,
      start_time DATETIME,
      accumulated_time INTEGER DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_name TEXT DEFAULT '自由职业者',
      hourly_rate REAL DEFAULT 50.0,
      logo_data TEXT DEFAULT ''
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time)`);

  saveDatabase();
}

function initializeDefaultData() {
  const timerResult = db.exec('SELECT COUNT(*) as count FROM timer_state');
  if (timerResult[0].values[0][0] === 0) {
    db.run(
      'INSERT INTO timer_state (id, is_running, accumulated_time) VALUES (1, 0, 0)'
    );
  }

  const settingsResult = db.exec('SELECT COUNT(*) as count FROM settings');
  if (settingsResult[0].values[0][0] === 0) {
    db.run(
      'INSERT INTO settings (id, user_name, hourly_rate) VALUES (1, ?, ?)',
      ['自由职业者', 50.0]
    );
  }

  const clientsResult = db.exec('SELECT COUNT(*) as count FROM clients');
  if (clientsResult[0].values[0][0] === 0) {
    insertSampleData();
  }

  saveDatabase();
}

function insertSampleData() {
  const sampleClients = [
    { id: 'client-1', name: '科技有限公司', email: 'contact@tech.com', address: '北京市朝阳区科技路88号' },
    { id: 'client-2', name: '创意设计工作室', email: 'hello@design.com', address: '上海市静安区创意园A座' },
  ];

  for (const client of sampleClients) {
    db.run(
      'INSERT INTO clients (id, name, email, address) VALUES (?, ?, ?, ?)',
      [client.id, client.name, client.email, client.address]
    );
  }

  const now = new Date();
  const sampleTasks = [
    {
      id: 'task-1',
      name: '网站首页设计',
      clientId: 'client-1',
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      duration: 3.5 * 3600,
    },
    {
      id: 'task-2',
      name: '后端API开发',
      clientId: 'client-1',
      startTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
      duration: 6 * 3600,
    },
    {
      id: 'task-3',
      name: 'Logo设计',
      clientId: 'client-2',
      startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(),
      duration: 3 * 3600,
    },
    {
      id: 'task-4',
      name: '用户界面优化',
      clientId: 'client-1',
      startTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
      duration: 3 * 3600,
    },
    {
      id: 'task-5',
      name: '品牌视觉设计',
      clientId: 'client-2',
      startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      duration: 5.5 * 3600,
    },
    {
      id: 'task-6',
      name: '数据库优化',
      clientId: 'client-1',
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(),
      duration: 4 * 3600,
    },
    {
      id: 'task-7',
      name: '移动端适配',
      clientId: 'client-1',
      startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      duration: 2.75 * 3600,
    },
  ];

  for (const task of sampleTasks) {
    db.run(
      'INSERT INTO tasks (id, name, client_id, start_time, end_time, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [task.id, task.name, task.clientId, task.startTime, task.endTime, task.duration]
    );
  }
}

function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('保存数据库失败:', err);
  }
}

function getDb() {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  return db;
}

export { initDatabase, getDb, saveDatabase };
