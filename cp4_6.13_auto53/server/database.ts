import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

let db: Database.Database;

export function initDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'booth.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booths (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      bg_color TEXT NOT NULL DEFAULT '#FFF8F0',
      primary_color TEXT NOT NULL DEFAULT '#C0874E',
      accent_color TEXT NOT NULL DEFAULT '#FF6B6B',
      cover_image TEXT,
      visit_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      booth_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      image TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '其他',
      favorite_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (booth_id) REFERENCES booths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      booth_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      is_seller INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (booth_id) REFERENCES booths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(product_id, visitor_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  seedData();
  return db;
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const now = Date.now();

  const user1Id = uuidv4();
  const user2Id = uuidv4();
  const user3Id = uuidv4();

  db.prepare('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)').run(user1Id, 'craftsman', '123456', now);
  db.prepare('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)').run(user2Id, 'pottery_lover', '123456', now);
  db.prepare('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)').run(user3Id, 'fabric_artist', '123456', now);

  const booth1Id = uuidv4();
  const booth2Id = uuidv4();
  const booth3Id = uuidv4();

  db.prepare(`
    INSERT INTO booths (id, user_id, name, description, bg_color, primary_color, accent_color, visit_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(booth1Id, user1Id, '木语手作', '专注于木质工艺品的设计与制作，每一件作品都凝聚着匠心。✨🎨', '#FFF8F0', '#C0874E', '#FF6B6B', 156, now);

  db.prepare(`
    INSERT INTO booths (id, user_id, name, description, bg_color, primary_color, accent_color, visit_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(booth2Id, user2Id, '陶然居', '手工陶艺，泥土的温度，指尖的艺术。🏺✨', '#FFF8F0', '#8B6914', '#E67E22', 98, now);

  db.prepare(`
    INSERT INTO booths (id, user_id, name, description, bg_color, primary_color, accent_color, visit_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(booth3Id, user3Id, '织梦坊', '布艺手工，一针一线都是故事。🧵🌸', '#FFF8F0', '#9B59B6', '#FF69B4', 120, now);

  const products = [
    { boothId: booth1Id, name: '木质书签套装', description: '精选胡桃木制作，手感温润，一套三枚不同造型。', price: 68, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20bookmark%20set%20craft%20handmade%20walnut&image_size=square', category: '饰品', favoriteCount: 32 },
    { boothId: booth1Id, name: '原木手机支架', description: '简约设计，实木打造，适配各种手机型号。', price: 45, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20phone%20stand%20minimalist%20craft&image_size=square', category: '其他', favoriteCount: 18 },
    { boothId: booth1Id, name: '木质首饰盒', description: '樱桃木制作，内衬绒布，精致小巧。', price: 128, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20jewelry%20box%20handmade%20craft&image_size=square', category: '饰品', favoriteCount: 45 },
    { boothId: booth1Id, name: '手作木勺', description: '食品级木蜡油处理，安全健康，厨房好物。', price: 35, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20wooden%20spoon%20kitchen%20craft&image_size=square', category: '其他', favoriteCount: 12 },
    { boothId: booth2Id, name: '手工陶杯', description: '手拉坯制作，每一只都独一无二。', price: 88, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20ceramic%20cup%20pottery%20craft&image_size=square', category: '陶艺', favoriteCount: 56 },
    { boothId: booth2Id, name: '陶罐花瓶', description: '粗陶质感，日式风格，适合插放干花。', price: 156, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ceramic%20vase%20pottery%20japanese%20style&image_size=square', category: '陶艺', favoriteCount: 28 },
    { boothId: booth2Id, name: '陶土小碗', description: '可爱造型，适合盛放甜品或小食。', price: 42, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20ceramic%20bowl%20cute%20pottery&image_size=square', category: '陶艺', favoriteCount: 34 },
    { boothId: booth3Id, name: '刺绣书签', description: '手工刺绣，精美图案，文艺气息满满。', price: 28, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=embroidered%20bookmark%20fabric%20craft&image_size=square', category: '布艺', favoriteCount: 41 },
    { boothId: booth3Id, name: '布艺收纳袋', description: '纯棉面料，多种图案可选，实用又美观。', price: 38, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fabric%20storage%20bag%20handmade%20cotton&image_size=square', category: '布艺', favoriteCount: 22 },
    { boothId: booth3Id, name: '手作拼布钱包', description: '拼布工艺，独特设计，小巧便携。', price: 98, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=patchwork%20wallet%20handmade%20fabric%20craft&image_size=square', category: '布艺', favoriteCount: 19 },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (id, booth_id, name, description, price, image, category, favorite_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  products.forEach((p, index) => {
    insertProduct.run(uuidv4(), p.boothId, p.name, p.description, p.price, p.image, p.category, p.favoriteCount, now + index * 1000);
  });

  const insertMessage = db.prepare(`
    INSERT INTO messages (id, booth_id, sender_name, is_seller, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMessage.run(uuidv4(), booth1Id, '访客小明', 0, '你好，这个书签可以定制刻字吗？', now - 86400000);
  insertMessage.run(uuidv4(), booth1Id, '木语手作', 1, '可以的哦，刻字需要额外加10元~', now - 86000000);
  insertMessage.run(uuidv4(), booth2Id, '陶艺爱好者', 0, '陶杯可以进微波炉吗？', now - 72000000);
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export type User = {
  id: string;
  username: string;
  password: string;
  created_at: number;
};

export type Booth = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  bg_color: string;
  primary_color: string;
  accent_color: string;
  cover_image: string | null;
  visit_count: number;
  created_at: number;
};

export type Product = {
  id: string;
  booth_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  favorite_count: number;
  created_at: number;
};

export type Message = {
  id: string;
  booth_id: string;
  sender_name: string;
  is_seller: number;
  content: string;
  created_at: number;
};
