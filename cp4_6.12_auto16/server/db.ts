import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'data.db'));
db.pragma('journal_mode = WAL');

export interface Wood {
  id: number;
  name: string;
  origin: string;
  color: string;
  category: 'top' | 'back' | 'side' | 'fingerboard' | 'neck';
  stock: number;
  threshold: number;
  description: string;
}

export interface Instrument {
  id: number;
  name: string;
  type: 'classical_guitar' | 'acoustic_guitar' | 'violin' | 'ukulele';
  description: string;
  basePrice: number;
  image: string;
}

export interface Order {
  id: number;
  instrumentType: string;
  instrumentName: string;
  topWoodId: number;
  backWoodId: number;
  sideWoodId: number;
  fingerboardWoodId: number;
  neckWoodId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface TuningRecord {
  id: number;
  orderId: number;
  tuningDate: string;
  pitch: number;
  notes: string;
  createdAt: string;
}

export const initDB = (): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS woods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      color TEXT NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER NOT NULL DEFAULT 10,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      basePrice REAL NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrumentType TEXT NOT NULL,
      instrumentName TEXT NOT NULL,
      topWoodId INTEGER NOT NULL,
      backWoodId INTEGER NOT NULL,
      sideWoodId INTEGER NOT NULL,
      fingerboardWoodId INTEGER NOT NULL,
      neckWoodId INTEGER NOT NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      notes TEXT,
      status INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (topWoodId) REFERENCES woods(id),
      FOREIGN KEY (backWoodId) REFERENCES woods(id),
      FOREIGN KEY (sideWoodId) REFERENCES woods(id),
      FOREIGN KEY (fingerboardWoodId) REFERENCES woods(id),
      FOREIGN KEY (neckWoodId) REFERENCES woods(id)
    );

    CREATE TABLE IF NOT EXISTS tuning_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      tuningDate TEXT NOT NULL,
      pitch INTEGER NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS progress_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      status INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );
  `);

  const woodCount = db.prepare('SELECT COUNT(*) as count FROM woods').get() as { count: number };
  if (woodCount.count === 0) {
    const insertWood = db.prepare(`
      INSERT INTO woods (name, origin, color, category, stock, threshold, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const woods = [
      ['雪松', '加拿大', '#CD853F', 'top', 15, 10, '雪松面板音色温暖圆润，低音浑厚，高音清澈，适合古典吉他和民谣吉他。'],
      ['云杉', '德国', '#F5DEB3', 'top', 20, 10, '云杉面板音色明亮通透，动态范围广，是传统吉他面板的首选材料。'],
      ['红松', '美国', '#BC8F8F', 'top', 3, 10, '红松面板开声快，音色温暖柔和，适合指弹风格。'],
      ['玫瑰木', '巴西', '#A0522D', 'back', 8, 10, '巴西玫瑰木纹理华丽，音色深邃丰富，是高端吉他背侧板的经典选择。'],
      ['桃花心木', '洪都拉斯', '#C04E2E', 'back', 12, 10, '桃花心木音色温暖饱满，中频突出，重量较轻，适合长时间演奏。'],
      ['枫木', '欧洲', '#DEB887', 'back', 25, 10, '枫木音色明亮清晰，高频出色，常用于小提琴和爵士吉他。'],
      ['沙比利', '非洲', '#D2691E', 'side', 18, 10, '沙比利木纹理均匀，音色平衡，是性价比很高的侧板材料。'],
      ['胡桃木', '美国', '#654321', 'side', 6, 10, '胡桃木纹理美观，音色温暖厚实，视觉效果出色。'],
      ['樱桃木', '欧洲', '#CD5C5C', 'side', 10, 10, '樱桃木随时间颜色会加深，音色温和圆润。'],
      ['乌木', '印度', '#2F1810', 'fingerboard', 5, 10, '乌木质地坚硬致密，触感顺滑，是高端指板的标准材料。'],
      ['玫瑰木指板', '印度', '#3D2314', 'fingerboard', 14, 10, '印度玫瑰木指板音色温暖，手感舒适，性价比高。'],
      ['枫木指板', '加拿大', '#F0D9A8', 'fingerboard', 30, 10, '枫木指板音色明亮，适合需要清晰音色的演奏风格。'],
      ['桃花心木琴颈', '洪都拉斯', '#C04E2E', 'neck', 22, 10, '桃花心木琴颈稳定性好，音色温暖，是吉他琴颈的经典选择。'],
      ['枫木琴颈', '北美', '#DEB887', 'neck', 28, 10, '枫木琴颈硬度高，音色明亮，适合需要快速演奏的乐手。'],
      ['胡桃木琴颈', '美国', '#8B5E3C', 'neck', 9, 10, '胡桃木琴颈外观优雅，音色平衡，手感舒适。'],
    ];

    const transaction = db.transaction(() => {
      for (const wood of woods) {
        insertWood.run(...wood);
      }
    });
    transaction();
  }

  const instrumentCount = db.prepare('SELECT COUNT(*) as count FROM instruments').get() as { count: number };
  if (instrumentCount.count === 0) {
    const insertInstrument = db.prepare(`
      INSERT INTO instruments (name, type, description, basePrice, image)
      VALUES (?, ?, ?, ?, ?)
    `);

    const instruments = [
      ['古典吉他', 'classical_guitar', '传统尼龙弦古典吉他，适合演奏古典音乐和弗拉门戈。音色温暖圆润，手感舒适。', 8800, ''],
      ['民谣吉他', 'acoustic_guitar', '钢弦民谣吉他，适合弹唱、指弹等多种风格。音色明亮，穿透力强。', 6800, ''],
      ['小提琴', 'violin', '手工制作的4/4小提琴，选用优质材料，音色优美纯净，适合专业演奏。', 12800, ''],
      ['尤克里里', 'ukulele', '23寸尤克里里，小巧便携，音色清脆欢快，适合入门和休闲演奏。', 1800, ''],
    ];

    const transaction = db.transaction(() => {
      for (const instrument of instruments) {
        insertInstrument.run(...instrument);
      }
    });
    transaction();
  }
};

export const getWoods = (category?: string): Wood[] => {
  if (category) {
    return db.prepare('SELECT * FROM woods WHERE category = ?').all(category) as Wood[];
  }
  return db.prepare('SELECT * FROM woods').all() as Wood[];
};

export const getWoodById = (id: number): Wood | undefined => {
  return db.prepare('SELECT * FROM woods WHERE id = ?').get(id) as Wood | undefined;
};

export const getInstruments = (): Instrument[] => {
  return db.prepare('SELECT * FROM instruments').all() as Instrument[];
};

export const getInstrumentByType = (type: string): Instrument | undefined => {
  return db.prepare('SELECT * FROM instruments WHERE type = ?').get(type) as Instrument | undefined;
};

export interface OrderInput {
  instrumentType: string;
  instrumentName: string;
  topWoodId: number;
  backWoodId: number;
  sideWoodId: number;
  fingerboardWoodId: number;
  neckWoodId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

export const createOrder = (input: OrderInput): number => {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO orders (
      instrumentType, instrumentName, topWoodId, backWoodId, sideWoodId,
      fingerboardWoodId, neckWoodId, customerName, customerEmail, customerPhone,
      notes, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    input.instrumentType, input.instrumentName, input.topWoodId, input.backWoodId,
    input.sideWoodId, input.fingerboardWoodId, input.neckWoodId,
    input.customerName, input.customerEmail, input.customerPhone,
    input.notes, now, now
  );

  db.prepare(`
    INSERT INTO progress_history (orderId, status, timestamp)
    VALUES (?, 0, ?)
  `).run(result.lastInsertRowid, now);

  const decrementWood = db.prepare('UPDATE woods SET stock = stock - 1 WHERE id = ? AND stock > 0');
  [input.topWoodId, input.backWoodId, input.sideWoodId, input.fingerboardWoodId, input.neckWoodId].forEach(id => {
    decrementWood.run(id);
  });

  return Number(result.lastInsertRowid);
};

export const getOrders = (): Order[] => {
  return db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all() as Order[];
};

export const getOrderById = (id: number): Order | undefined => {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | undefined;
};

export interface ProgressHistoryEntry {
  id: number;
  orderId: number;
  status: number;
  timestamp: string;
}

export const getProgressHistory = (orderId: number): ProgressHistoryEntry[] => {
  return db.prepare('SELECT * FROM progress_history WHERE orderId = ? ORDER BY timestamp ASC').all(orderId) as ProgressHistoryEntry[];
};

export const updateOrderStatus = (orderId: number, status: number): void => {
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, orderId);
  db.prepare(`
    INSERT INTO progress_history (orderId, status, timestamp)
    VALUES (?, ?, ?)
  `).run(orderId, status, now);
};

export const addTuningRecord = (orderId: number, tuningDate: string, pitch: number, notes: string): number => {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO tuning_records (orderId, tuningDate, pitch, notes, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(orderId, tuningDate, pitch, notes, now);
  return Number(result.lastInsertRowid);
};

export const getTuningRecords = (orderId: number): TuningRecord[] => {
  return db.prepare('SELECT * FROM tuning_records WHERE orderId = ? ORDER BY createdAt DESC').all(orderId) as TuningRecord[];
};

export const updateWoodStock = (woodId: number, stock: number): void => {
  db.prepare('UPDATE woods SET stock = ? WHERE id = ?').run(stock, woodId);
};

export const getLowStockWoods = (): Wood[] => {
  return db.prepare('SELECT * FROM woods WHERE stock < threshold ORDER BY stock ASC').all() as Wood[];
};
