import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'coffee.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS green_bean_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batchNo TEXT NOT NULL UNIQUE,
      origin TEXT NOT NULL,
      processing TEXT NOT NULL,
      variety TEXT NOT NULL,
      initialWeight REAL NOT NULL,
      remainingWeight REAL NOT NULL,
      receiveDate TEXT NOT NULL,
      threshold REAL NOT NULL DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      beanOrigin TEXT NOT NULL,
      beanBatchId INTEGER,
      greenBeanWeight REAL NOT NULL,
      roastedBeanWeight REAL NOT NULL,
      yieldRate REAL NOT NULL,
      chargeTemp REAL NOT NULL,
      firstCrackTime REAL NOT NULL,
      dropTemp REAL NOT NULL,
      controlPoints TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (beanBatchId) REFERENCES green_bean_batches(id)
    );

    CREATE TABLE IF NOT EXISTS coffee_beans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      processing TEXT NOT NULL,
      flavorNotes TEXT NOT NULL,
      altitude TEXT,
      variety TEXT,
      stockRoasted REAL DEFAULT 0,
      roastLevels TEXT NOT NULL,
      flavorProfile TEXT NOT NULL,
      imageColor TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 98
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      coffeeId INTEGER NOT NULL,
      roastLevel TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (coffeeId) REFERENCES coffee_beans(id)
    );

    CREATE INDEX IF NOT EXISTS idx_gbb_origin ON green_bean_batches(origin);
    CREATE INDEX IF NOT EXISTS idx_gbb_processing ON green_bean_batches(processing);
    CREATE INDEX IF NOT EXISTS idx_gbb_receiveDate ON green_bean_batches(receiveDate);
  `)

  const insertBatch = db.prepare(`
    INSERT OR IGNORE INTO green_bean_batches 
    (batchNo, origin, processing, variety, initialWeight, remainingWeight, receiveDate, threshold) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batches = [
    ['GB-2026-001', '埃塞俄比亚 耶加雪菲', '水洗', 'Heirloom', 50, 45, '2026-05-01', 10],
    ['GB-2026-002', '哥伦比亚 慧兰', '水洗', 'Castillo', 60, 8, '2026-05-10', 10],
    ['GB-2026-003', '肯尼亚 AA', '水洗', 'SL28/SL34', 40, 35, '2026-05-15', 10],
    ['GB-2026-004', '危地马拉 安提瓜', '水洗', 'Bourbon', 45, 42, '2026-05-20', 10],
  ]

  const insertCoffee = db.prepare(`
    INSERT OR IGNORE INTO coffee_beans 
    (name, origin, processing, flavorNotes, altitude, variety, stockRoasted, roastLevels, flavorProfile, imageColor, price) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const coffees = [
    ['耶加雪菲 科契尔', '埃塞俄比亚', '水洗', '["柑橘","茉莉","蜂蜜","红茶"]', '1950-2100m', 'Heirloom', 15, '["light","medium"]', '{"acidity":8,"bitterness":3,"sweetness":7,"body":5,"cleanliness":9,"aftertaste":7}', '#87CEEB', 128],
    ['哥伦比亚 慧兰', '哥伦比亚', '水洗', '["焦糖","坚果","巧克力","柑橘"]', '1700-1900m', 'Castillo', 5, '["medium","dark"]', '{"acidity":5,"bitterness":5,"sweetness":7,"body":7,"cleanliness":8,"aftertaste":6}', '#DEB887', 98],
    ['肯尼亚 AA Top', '肯尼亚', '水洗', '["黑醋栗","番茄","百香果","明亮酸质"]', '1700-1900m', 'SL28/SL34', 12, '["light","medium"]', '{"acidity":9,"bitterness":4,"sweetness":6,"body":6,"cleanliness":8,"aftertaste":8}', '#CD5C5C', 138],
    ['危地马拉 安提瓜', '危地马拉', '水洗', '["可可","焦糖","橙花","温和"]', '1500-1700m', 'Bourbon', 20, '["medium","dark"]', '{"acidity":6,"bitterness":6,"sweetness":7,"body":8,"cleanliness":7,"aftertaste":7}', '#6B8E23', 108],
    ['曼特宁 G1', '印度尼西亚', '湿刨', '["草本","黑巧克力","木质","低酸"]', '1200-1500m', 'Typica/Bourbon', 0, '["medium","dark"]', '{"acidity":2,"bitterness":7,"sweetness":5,"body":9,"cleanliness":6,"aftertaste":6}', '#2F4F4F', 118],
  ]

  const insertRecipe = db.prepare(`
    INSERT OR IGNORE INTO recipes 
    (name, beanOrigin, beanBatchId, greenBeanWeight, roastedBeanWeight, yieldRate, chargeTemp, firstCrackTime, dropTemp, controlPoints) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const defaultPoints = JSON.stringify([
    { time: 0, temperature: 180 },
    { time: 3, temperature: 160 },
    { time: 6, temperature: 180 },
    { time: 9, temperature: 200 },
    { time: 12, temperature: 215 },
  ])

  const recipes = [
    ['耶加雪菲 浅烘焙配方', '埃塞俄比亚 耶加雪菲', 1, 1000, 820, 82, 180, 9, 205, defaultPoints],
    ['慧兰 中深烘焙配方', '哥伦比亚 慧兰', 2, 1000, 800, 80, 180, 10, 215, JSON.stringify([
      { time: 0, temperature: 180 },
      { time: 4, temperature: 155 },
      { time: 8, temperature: 185 },
      { time: 11, temperature: 205 },
      { time: 14, temperature: 220 },
    ])],
  ]

  const tx = db.transaction(() => {
    batches.forEach(b => insertBatch.run(...b))
    coffees.forEach(c => insertCoffee.run(...c))
    recipes.forEach(r => insertRecipe.run(...r))
  })

  tx()
}

export default db
