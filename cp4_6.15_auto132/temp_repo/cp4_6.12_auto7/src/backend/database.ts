import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'workshop.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    project_type TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    design_images TEXT,
    wood_type TEXT NOT NULL,
    surface_finish TEXT NOT NULL,
    expected_date TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending_quote',
    price REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS wood (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    origin TEXT NOT NULL,
    grade TEXT NOT NULL,
    stock_count INTEGER NOT NULL DEFAULT 0,
    standard_size TEXT NOT NULL,
    unit_price REAL NOT NULL,
    stock_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    purchase_date TEXT NOT NULL,
    last_maintenance_date TEXT NOT NULL,
    maintenance_cycle_months INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    maintenance_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    description TEXT,
    cost REAL,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
  );
`);

const woodCount = db.prepare('SELECT COUNT(*) as count FROM wood').get() as { count: number };
if (woodCount.count === 0) {
  const insertWood = db.prepare(`
    INSERT INTO wood (id, name, origin, grade, stock_count, standard_size, unit_price, stock_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const woodSamples = [
    ['w1', '黑胡桃木', '美国', '一级', 3, '2440x1220x25mm', 850, '2024-10-15'],
    ['w2', '北美红橡木', '美国', '一级', 12, '2440x1220x25mm', 580, '2024-09-20'],
    ['w3', '美国樱桃木', '美国', '一级', 8, '2440x1220x25mm', 720, '2024-10-01'],
    ['w4', '硬枫木', '加拿大', '一级', 6, '2440x1220x25mm', 650, '2024-08-10'],
    ['w5', '白橡木', '欧洲', '二级', 15, '2440x1220x25mm', 480, '2024-11-05'],
    ['w6', '水曲柳', '中国东北', '一级', 10, '2440x1220x25mm', 380, '2024-09-15'],
    ['w7', '柚木', '缅甸', '特级', 4, '2440x1220x25mm', 1200, '2024-07-20'],
    ['w8', '黑胡桃木', '美国', '二级', 20, '2440x1220x20mm', 650, '2024-10-25'],
    ['w9', '榉木', '欧洲', '三级', 25, '2440x1220x25mm', 280, '2024-11-10'],
    ['w10', '松木', '新西兰', '二级', 30, '2440x1220x25mm', 180, '2024-11-15'],
  ];

  const insertMany = db.transaction((woods: typeof woodSamples) => {
    for (const wood of woods) {
      insertWood.run(...wood);
    }
  });
  insertMany(woodSamples);
  console.log('已插入10条木料库存示例数据');
}

const toolsCount = db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number };
if (toolsCount.count === 0) {
  const insertTool = db.prepare(`
    INSERT INTO tools (id, name, model, purchase_date, last_maintenance_date, maintenance_cycle_months)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const toolSamples = [
    ['t1', '台锯', 'SawStop PCS31230', '2022-03-15', '2024-10-20', 3],
    ['t2', '平刨', 'Jet JWP-15B', '2022-05-10', '2024-08-15', 3],
    ['t3', '砂光机', 'Festool ETS 150/3', '2023-01-20', '2024-11-01', 2],
    ['t4', '带锯', 'Laguna 14/BX', '2022-08-05', '2024-06-10', 6],
    ['t5', '雕刻机', 'Makita RP2301FC', '2023-06-18', '2024-12-01', 6],
  ];

  const insertMany = db.transaction((tools: typeof toolSamples) => {
    for (const tool of tools) {
      insertTool.run(...tool);
    }
  });
  insertMany(toolSamples);
  console.log('已插入5件工具示例数据');
}

const projectsCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
if (projectsCount.count === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (id, project_type, customer_name, customer_email, customer_phone, wood_type, surface_finish, expected_date, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projectSamples = [
    ['p1', '桌子', '张先生', 'zhang@example.com', '13800138001', '黑胡桃木', '木蜡油', '2025-01-15', '一张简约风格的餐桌，需要容纳6人用餐', 'pending_quote'],
    ['p2', '椅子', '李女士', 'li@example.com', '13900139002', '北美红橡木', '清漆', '2024-12-30', '四把北欧风格餐椅，与现有餐桌搭配', 'pending_quote'],
    ['p3', '柜子', '王先生', 'wang@example.com', '13700137003', '美国樱桃木', '染色', '2025-02-01', '落地书柜，高度2.2米，需要分层设计', 'pending_quote'],
  ];

  const insertMany = db.transaction((projects: typeof projectSamples) => {
    for (const project of projects) {
      insertProject.run(...project);
    }
  });
  insertMany(projectSamples);
  console.log('已插入3个待报价项目示例数据');
}

export default db;
