import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'repair.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      device_model TEXT NOT NULL,
      fault_description TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS order_parts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_parts_order_id ON order_parts(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_parts_part_id ON order_parts(part_id);
  `);

  const partCount = db.prepare('SELECT COUNT(*) as count FROM parts').get() as { count: number };
  if (partCount.count === 0) {
    const insertPart = db.prepare(
      'INSERT INTO parts (id, name, model, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
    );
    const sampleParts = [
      { id: 'p1', name: '主板', model: 'MB-2024-01', quantity: 15, unit_price: 299.0 },
      { id: 'p2', name: '显示屏', model: 'LCD-55-001', quantity: 8, unit_price: 450.0 },
      { id: 'p3', name: '电池', model: 'BAT-LI-5000', quantity: 25, unit_price: 89.0 },
      { id: 'p4', name: '电源适配器', model: 'PWR-12V-5A', quantity: 5, unit_price: 65.0 },
      { id: 'p5', name: '内存条', model: 'RAM-8G-DDR4', quantity: 30, unit_price: 120.0 },
      { id: 'p6', name: '固态硬盘', model: 'SSD-256G', quantity: 12, unit_price: 180.0 },
      { id: 'p7', name: '风扇', model: 'FAN-CPU-01', quantity: 50, unit_price: 35.0 },
      { id: 'p8', name: '键盘', model: 'KB-STD-104', quantity: 3, unit_price: 55.0 },
      { id: 'p9', name: '触摸板', model: 'TP-LAP-01', quantity: 7, unit_price: 78.0 },
      { id: 'p10', name: '散热模块', model: 'HSINK-MOD-01', quantity: 18, unit_price: 42.0 }
    ];
    const tx = db.transaction((parts: typeof sampleParts) => {
      for (const p of parts) {
        insertPart.run(p.id, p.name, p.model, p.quantity, p.unit_price);
      }
    });
    tx(sampleParts);
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    const now = new Date().toISOString();
    const insertOrder = db.prepare(
      'INSERT INTO orders (id, device_model, fault_description, customer_name, customer_phone, status, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const sampleOrders = [
      {
        id: 'o1',
        device_model: '联想 ThinkPad T14',
        fault_description: '开机后屏幕黑屏，电源指示灯闪烁',
        customer_name: '张三',
        customer_phone: '13800138001',
        status: 'pending',
        created_at: now,
        updated_at: now,
        completed_at: null
      },
      {
        id: 'o2',
        device_model: 'iPhone 15 Pro',
        fault_description: '电池不耐用，充满电只能使用2小时',
        customer_name: '李四',
        customer_phone: '13800138002',
        status: 'repairing',
        created_at: now,
        updated_at: now,
        completed_at: null
      },
      {
        id: 'o3',
        device_model: '戴尔 XPS 13',
        fault_description: '键盘部分按键失灵',
        customer_name: '王五',
        customer_phone: '13800138003',
        status: 'completed',
        created_at: now,
        updated_at: now,
        completed_at: now
      }
    ];
    const tx = db.transaction((orders: typeof sampleOrders) => {
      for (const o of orders) {
        insertOrder.run(o.id, o.device_model, o.fault_description, o.customer_name, o.customer_phone, o.status, o.created_at, o.updated_at, o.completed_at);
      }
    });
    tx(sampleOrders);
  }
}

export default db;
