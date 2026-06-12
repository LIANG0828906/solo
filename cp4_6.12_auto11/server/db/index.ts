import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'data', 'quilt.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface Fabric {
  id: number;
  name: string;
  color: string;
  colorCode: string;
  pattern: string;
  gradient: string;
  pricePerMeter: number;
  stockMeters: number;
  width: number;
  description: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  widthCm: number;
  heightCm: number;
  gridCols: number;
  gridRows: number;
  layout: string;
  userId: number;
  totalCost: number;
  fabricUsage: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'customer';
  displayName: string;
  avatarColor: string;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    displayName TEXT NOT NULL,
    avatarColor TEXT DEFAULT '#B87333'
  );

  CREATE TABLE IF NOT EXISTS fabrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    colorCode TEXT NOT NULL,
    pattern TEXT NOT NULL DEFAULT 'solid',
    gradient TEXT NOT NULL,
    pricePerMeter REAL NOT NULL,
    stockMeters REAL NOT NULL DEFAULT 0,
    width REAL NOT NULL DEFAULT 1.5,
    description TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    widthCm REAL NOT NULL,
    heightCm REAL NOT NULL,
    gridCols INTEGER NOT NULL DEFAULT 20,
    gridRows INTEGER NOT NULL DEFAULT 20,
    layout TEXT DEFAULT '[]',
    userId INTEGER NOT NULL,
    totalCost REAL DEFAULT 0,
    fabricUsage TEXT DEFAULT '[]',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const seedUsers = db.prepare('SELECT COUNT(*) as count FROM users');
if ((seedUsers.get() as { count: number }).count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, displayName, avatarColor)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin123', 'admin', '工作室管理员', '#5D4037');
  insertUser.run('customer1', 'cust123', 'customer', '张设计师', '#B87333');
  insertUser.run('customer2', 'cust456', 'customer', '李手工匠', '#8D6E63');
}

const seedFabrics = db.prepare('SELECT COUNT(*) as count FROM fabrics');
if ((seedFabrics.get() as { count: number }).count === 0) {
  const insertFabric = db.prepare(`
    INSERT INTO fabrics (name, color, colorCode, pattern, gradient, pricePerMeter, stockMeters, width, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fabricsData = [
    ['暖阳米白', '白', '#F5F0E8', '纯色', 'linear-gradient(135deg, #FAF6F0 0%, #F5F0E8 100%)', 45, 12.5, 1.5, '柔软纯棉米白色，适合打底'],
    ['陶土赤褐', '红', '#B87333', '纯色', 'linear-gradient(135deg, #D4956A 0%, #B87333 100%)', 58, 3.2, 1.5, '温暖的陶土色调，主面料'],
    ['深棕胡桃', '黑', '#5D4037', '纯色', 'linear-gradient(135deg, #795548 0%, #5D4037 100%)', 52, 8.7, 1.5, '深沉的胡桃木色，点缀用'],
    ['亚麻条纹', '黄', '#D7C4A1', '条纹', 'linear-gradient(90deg, #D7C4A1 0%, #D7C4A1 50%, #C9B489 50%, #C9B489 100%)', 48, 6.8, 1.5, '经典亚麻条纹面料'],
    ['薄荷碎花', '绿', '#A8C3A0', '碎花', 'radial-gradient(circle at 30% 30%, #C5DDBE 2px, transparent 2px), radial-gradient(circle at 70% 70%, #8FB585 2px, transparent 2px), #A8C3A0', 62, 15.3, 1.5, '清新薄荷绿小碎花'],
    ['晴空浅蓝', '蓝', '#90AFC5', '纯色', 'linear-gradient(135deg, #B0CFE0 0%, #90AFC5 100%)', 46, 2.1, 1.5, '宁静的天空蓝色'],
    ['薰衣草紫', '紫', '#B8A9C9', '格纹', 'linear-gradient(45deg, #C9BCD6 25%, transparent 25%), linear-gradient(-45deg, #C9BCD6 25%, transparent 25%), #B8A9C9', 55, 4.5, 1.5, '优雅薰衣草紫色格纹'],
    ['玫瑰暖红', '红', '#C98A8A', '几何', 'linear-gradient(60deg, #DBA9A9 25%, transparent 25%), linear-gradient(120deg, #C98A8A 25%, transparent 25%), #D8B5B5', 54, 9.8, 1.5, '温暖玫瑰色几何图案'],
    ['森林深绿', '绿', '#6B8E6B', '纯色', 'linear-gradient(135deg, #8FB585 0%, #6B8E6B 100%)', 50, 7.2, 1.5, '沉稳的森林绿色'],
    ['深海藏蓝', '蓝', '#5C7A99', '碎花', 'radial-gradient(circle at 20% 40%, #7D9AB8 2px, transparent 2px), radial-gradient(circle at 60% 80%, #4A6480 2px, transparent 2px), #5C7A99', 56, 11.0, 1.5, '深海蓝色小碎花'],
    ['柠檬暖黄', '黄', '#E8D090', '条纹', 'linear-gradient(90deg, #F0DEB0 0%, #F0DEB0 33%, #E8D090 33%, #E8D090 66%, #DBC078 66%, #DBC078 100%)', 44, 5.6, 1.5, '明亮的柠檬黄条纹'],
    ['典雅深紫', '紫', '#8B7A9E', '纯色', 'linear-gradient(135deg, #A698B8 0%, #8B7A9E 100%)', 58, 13.4, 1.5, '典雅的深紫色'],
  ];

  const tx = db.transaction((items: typeof fabricsData) => {
    for (const item of items) {
      insertFabric.run(...item);
    }
  });
  tx(fabricsData);
}

export function getUserByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return db.prepare('SELECT id, username, role, displayName, avatarColor FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getAllFabrics(): Fabric[] {
  return db.prepare('SELECT * FROM fabrics ORDER BY createdAt DESC').all() as Fabric[];
}

export function getFabricById(id: number): Fabric | undefined {
  return db.prepare('SELECT * FROM fabrics WHERE id = ?').get(id) as Fabric | undefined;
}

export function createFabric(data: Omit<Fabric, 'id' | 'createdAt'>): Fabric {
  const stmt = db.prepare(`
    INSERT INTO fabrics (name, color, colorCode, pattern, gradient, pricePerMeter, stockMeters, width, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(data.name, data.color, data.colorCode, data.pattern, data.gradient, data.pricePerMeter, data.stockMeters, data.width, data.description);
  return getFabricById(result.lastInsertRowid as number)!;
}

export function updateFabric(id: number, data: Partial<Omit<Fabric, 'id' | 'createdAt'>>): Fabric {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE fabrics SET ${fields} WHERE id = ?`).run(...values, id);
  return getFabricById(id)!;
}

export function deleteFabric(id: number): void {
  db.prepare('DELETE FROM fabrics WHERE id = ?').run(id);
}

export function getProjectsByUser(userId: number): Project[] {
  return db.prepare('SELECT * FROM projects WHERE userId = ? ORDER BY updatedAt DESC').all(userId) as Project[];
}

export function getAllProjects(): Project[] {
  return db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all() as Project[];
}

export function getProjectById(id: number): Project | undefined {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
  const stmt = db.prepare(`
    INSERT INTO projects (name, widthCm, heightCm, gridCols, gridRows, layout, userId, totalCost, fabricUsage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name, data.widthCm, data.heightCm, data.gridCols, data.gridRows,
    data.layout, data.userId, data.totalCost, data.fabricUsage
  );
  return getProjectById(result.lastInsertRowid as number)!;
}

export function updateProject(id: number, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE projects SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  return getProjectById(id)!;
}

export function deleteProject(id: number): void {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export default db;
