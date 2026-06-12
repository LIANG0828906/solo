import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const db = new Database(path.join(__dirname, 'plant_rental.db'));
db.pragma('journal_mode = WAL');

export interface Plant {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  stock: number;
  image: string;
  water_cycle_days: number;
  last_watered: string | null;
  last_fertilized: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  plant_id: string;
  customer_name: string;
  phone: string;
  address: string;
  rental_period: '1month' | '3months' | '6months';
  total_price: number;
  status: 'pending' | 'accepted' | 'delivering' | 'renting' | 'returned' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CareRecord {
  id: string;
  plant_id: string;
  type: 'water' | 'fertilize' | 'prune' | 'repot';
  notes: string;
  created_at: string;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS plants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    water_cycle_days INTEGER NOT NULL DEFAULT 7,
    last_watered TEXT,
    last_fertilized TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    plant_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    rental_period TEXT NOT NULL,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
  );

  CREATE TABLE IF NOT EXISTS care_records (
    id TEXT PRIMARY KEY,
    plant_id TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
  );
`);

const plantCount = db.prepare('SELECT COUNT(*) as count FROM plants').get() as { count: number };
if (plantCount.count === 0) {
  const seedPlants = [
    {
      id: 'plant-1',
      name: '绿萝',
      description: '易于养护的常绿藤本植物，能有效净化室内空气，是新手入门的最佳选择。',
      price_monthly: 30,
      stock: 15,
      water_cycle_days: 7,
      image: ''
    },
    {
      id: 'plant-2',
      name: '龟背竹',
      description: '叶片独特如龟背，具有浓郁的热带风情，适合摆放在客厅或书房。',
      price_monthly: 68,
      stock: 8,
      water_cycle_days: 5,
      image: ''
    },
    {
      id: 'plant-3',
      name: '琴叶榕',
      description: '叶片大而优雅如提琴，是ins风家居的标配植物，提升空间格调。',
      price_monthly: 88,
      stock: 2,
      water_cycle_days: 10,
      image: ''
    },
    {
      id: 'plant-4',
      name: '发财树',
      description: '寓意吉祥的常绿乔木，耐阴性好，适合办公室和家庭摆放。',
      price_monthly: 58,
      stock: 12,
      water_cycle_days: 14,
      image: ''
    },
    {
      id: 'plant-5',
      name: '多肉组合',
      description: '小巧可爱的多肉植物组合，造型多变，非常适合办公桌装饰。',
      price_monthly: 25,
      stock: 20,
      water_cycle_days: 10,
      image: ''
    },
    {
      id: 'plant-6',
      name: '虎尾兰',
      description: '夜间释放氧气的神奇植物，耐干旱，净化空气能力超强。',
      price_monthly: 35,
      stock: 1,
      water_cycle_days: 14,
      image: ''
    },
    {
      id: 'plant-7',
      name: '散尾葵',
      description: '优雅的棕榈科植物，增加空气湿度，营造热带雨林氛围。',
      price_monthly: 75,
      stock: 6,
      water_cycle_days: 5,
      image: ''
    },
    {
      id: 'plant-8',
      name: '橡皮树',
      description: '叶片厚实有光泽，生命力顽强，具有很高的观赏价值。',
      price_monthly: 55,
      stock: 10,
      water_cycle_days: 7,
      image: ''
    }
  ];

  const insertPlant = db.prepare(`
    INSERT INTO plants (id, name, description, price_monthly, stock, image, water_cycle_days, last_watered, last_fertilized, created_at)
    VALUES (@id, @name, @description, @price_monthly, @stock, @image, @water_cycle_days, NULL, NULL, @created_at)
  `);

  const now = new Date().toISOString();
  const insertMany = db.transaction((plants: typeof seedPlants) => {
    for (const plant of plants) {
      insertPlant.run({ ...plant, created_at: now });
    }
  });

  insertMany(seedPlants);
  console.log('种子数据已初始化');
}
