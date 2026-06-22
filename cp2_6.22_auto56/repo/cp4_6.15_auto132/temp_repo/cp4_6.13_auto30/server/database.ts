import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface User {
  id: number;
  name: string;
  avatarColor: string;
  rating: number;
  badge: 'bronze' | 'silver' | 'gold';
  reviewCount: number;
  lat: number;
  lng: number;
}

export interface Skill {
  id: number;
  userId: number;
  category: string;
  title: string;
  description: string;
  availability: string;
  radius: number;
}

export interface Exchange {
  id: number;
  skillId: number;
  fromUserId: number;
  toUserId: number;
  scheduledDate: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: number;
  exchangeId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatarColor TEXT NOT NULL DEFAULT '#4A6741',
      rating REAL NOT NULL DEFAULT 5.0,
      badge TEXT NOT NULL DEFAULT 'bronze',
      reviewCount INTEGER NOT NULL DEFAULT 0,
      lat REAL NOT NULL DEFAULT 31.2304,
      lng REAL NOT NULL DEFAULT 121.4737
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT '[]',
      radius REAL NOT NULL DEFAULT 5.0,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skillId INTEGER NOT NULL,
      fromUserId INTEGER NOT NULL,
      toUserId INTEGER NOT NULL,
      scheduledDate TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skillId) REFERENCES skills(id),
      FOREIGN KEY (fromUserId) REFERENCES users(id),
      FOREIGN KEY (toUserId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exchangeId INTEGER NOT NULL UNIQUE,
      reviewerId INTEGER NOT NULL,
      revieweeId INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exchangeId) REFERENCES exchanges(id),
      FOREIGN KEY (reviewerId) REFERENCES users(id),
      FOREIGN KEY (revieweeId) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const insertUser = db.prepare(`
    INSERT INTO users (name, avatarColor, rating, badge, reviewCount, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['张师傅', '#8B4513', 4.8, 'gold', 24, 31.2308, 121.4740],
    ['李老师', '#2E86AB', 4.6, 'silver', 12, 31.2299, 121.4729],
    ['王阿姨', '#C1666B', 4.9, 'gold', 31, 31.2312, 121.4748],
    ['小陈', '#4A6741', 4.3, 'bronze', 5, 31.2320, 121.4752],
    ['赵大厨', '#D4A574', 4.7, 'silver', 18, 31.2290, 121.4718],
    ['刘爷爷', '#6B5B95', 4.5, 'silver', 15, 31.2300, 121.4735],
    ['孙姐姐', '#E26D5C', 4.4, 'bronze', 8, 31.2315, 121.4745]
  ];

  const userIds: number[] = [];
  for (const u of users) {
    const result = insertUser.run(...u as any[]);
    userIds.push(Number(result.lastInsertRowid));
  }

  const insertSkill = db.prepare(`
    INSERT INTO skills (userId, category, title, description, availability, radius)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const skills: any[] = [
    [userIds[0], '维修', '家庭水管维修', '15年水电工经验，擅长水管漏水、龙头更换、马桶疏通，可提供基础配件。',
      JSON.stringify([{ day: 1, startHour: 19, endHour: 21 }, { day: 3, startHour: 19, endHour: 21 }, { day: 6, startHour: 9, endHour: 17 }]), 3.0],
    [userIds[1], '教育', '编程入门辅导', 'Python/Scratch零基础教学，适合青少年入门，每节课准备配套练习。',
      JSON.stringify([{ day: 2, startHour: 19, endHour: 21 }, { day: 4, startHour: 19, endHour: 21 }, { day: 0, startHour: 10, endHour: 16 }]), 5.0],
    [userIds[2], '烹饪', '家常菜/甜点制作', '上海本帮菜及西式甜点教学，可提供材料清单和现场示范，成品可带走。',
      JSON.stringify([{ day: 5, startHour: 14, endHour: 18 }, { day: 6, startHour: 14, endHour: 18 }]), 2.0],
    [userIds[3], '园艺', '阳台绿植养护', '多肉、绿萝、月季等常见绿植修剪、换盆、病虫害防治指导。',
      JSON.stringify([{ day: 0, startHour: 9, endHour: 12 }, { day: 6, startHour: 9, endHour: 12 }]), 4.0],
    [userIds[4], '教育', '英语口语陪练', '商务英语与日常对话，全英文交流，纠正发音与表达。',
      JSON.stringify([{ day: 1, startHour: 20, endHour: 22 }, { day: 3, startHour: 20, endHour: 22 }, { day: 5, startHour: 20, endHour: 22 }]), 6.0],
    [userIds[0], '维修', '灯具安装检修', '吊灯、吸顶灯、灯带等灯具安装，电路检测排查。',
      JSON.stringify([{ day: 2, startHour: 19, endHour: 21 }, { day: 5, startHour: 19, endHour: 21 }]), 3.5],
    [userIds[2], '烹饪', '中式面点制作', '包子、馒头、花卷、饺子皮手工制作教学，老面发酵技术传授。',
      JSON.stringify([{ day: 1, startHour: 9, endHour: 12 }, { day: 4, startHour: 9, endHour: 12 }]), 2.5],
    [userIds[1], '教育', '作业辅导（小学）', '语数英全科小学作业辅导，注重学习习惯培养。',
      JSON.stringify([{ day: 1, startHour: 17, endHour: 19 }, { day: 2, startHour: 17, endHour: 19 }, { day: 4, startHour: 17, endHour: 19 }]), 3.0],
    [userIds[5], '园艺', '花卉栽培教学', '牡丹、兰花、君子兰等名贵花卉养护，家庭小院景观设计咨询。',
      JSON.stringify([{ day: 3, startHour: 8, endHour: 12 }, { day: 6, startHour: 8, endHour: 12 }]), 4.5],
    [userIds[6], '维修', '缝纫/衣物改款', '牛仔、西装、旗袍等各类衣物修补改款，手工精补无痕处理。',
      JSON.stringify([{ day: 2, startHour: 14, endHour: 18 }, { day: 4, startHour: 14, endHour: 18 }, { day: 0, startHour: 10, endHour: 16 }]), 2.8],
    [userIds[3], '教育', '儿童绘画启蒙', '创意美术、水彩、彩铅教学，激发儿童创造力和想象力。',
      JSON.stringify([{ day: 6, startHour: 14, endHour: 17 }, { day: 0, startHour: 14, endHour: 17 }]), 3.0],
    [userIds[5], '烹饪', '养生煲汤教学', '四季养生汤品、药膳搭配，根据体质定制汤方。',
      JSON.stringify([{ day: 1, startHour: 10, endHour: 13 }, { day: 5, startHour: 10, endHour: 13 }]), 2.0]
  ];

  for (const s of skills) {
    insertSkill.run(...s);
  }
}

export function getAllSkills(category?: string, lat?: number, lng?: number): (Skill & { user: User; distance: number })[] {
  let sql = `
    SELECT s.*, u.name as user_name, u.avatarColor as user_avatarColor,
           u.rating as user_rating, u.badge as user_badge,
           u.reviewCount as user_reviewCount, u.lat as user_lat, u.lng as user_lng
    FROM skills s JOIN users u ON s.userId = u.id
  `;
  const params: any[] = [];
  if (category) {
    sql += ' WHERE s.category = ?';
    params.push(category);
  }
  const rows = db.prepare(sql).all(...params) as any[];

  const result = rows.map(row => {
    const user: User = {
      id: row.userId,
      name: row.user_name,
      avatarColor: row.user_avatarColor,
      rating: row.user_rating,
      badge: row.user_badge,
      reviewCount: row.user_reviewCount,
      lat: row.user_lat,
      lng: row.user_lng
    };
    const baseLat = lat ?? 31.2304;
    const baseLng = lng ?? 121.4737;
    const distance = haversine(baseLat, baseLng, user.lat, user.lng);
    return {
      id: row.id,
      userId: row.userId,
      category: row.category,
      title: row.title,
      description: row.description,
      availability: row.availability,
      radius: row.radius,
      user,
      distance
    };
  });

  return result.sort((a, b) => a.distance - b.distance);
}

export function getSkillById(id: number): (Skill & { user: User; distance: number }) | null {
  const row = db.prepare(`
    SELECT s.*, u.name as user_name, u.avatarColor as user_avatarColor,
           u.rating as user_rating, u.badge as user_badge,
           u.reviewCount as user_reviewCount, u.lat as user_lat, u.lng as user_lng
    FROM skills s JOIN users u ON s.userId = u.id
    WHERE s.id = ?
  `).get(id) as any;
  if (!row) return null;
  const user: User = {
    id: row.userId,
    name: row.user_name,
    avatarColor: row.user_avatarColor,
    rating: row.user_rating,
    badge: row.user_badge,
    reviewCount: row.user_reviewCount,
    lat: row.user_lat,
    lng: row.user_lng
  };
  const distance = haversine(31.2304, 121.4737, user.lat, user.lng);
  return {
    id: row.id,
    userId: row.userId,
    category: row.category,
    title: row.title,
    description: row.description,
    availability: row.availability,
    radius: row.radius,
    user,
    distance
  };
}

export function createExchange(data: Omit<Exchange, 'id' | 'createdAt' | 'status'>): Exchange {
  const result = db.prepare(`
    INSERT INTO exchanges (skillId, fromUserId, toUserId, scheduledDate, startTime, endTime, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(data.skillId, data.fromUserId, data.toUserId, data.scheduledDate, data.startTime, data.endTime);
  return getExchangeById(Number(result.lastInsertRowid))!;
}

export function getExchangeById(id: number): (Exchange & { skill?: Skill; fromUser?: User; toUser?: User }) | null {
  const row = db.prepare(`
    SELECT e.*,
           s.category as skill_category, s.title as skill_title, s.description as skill_description,
           fu.name as from_name, fu.avatarColor as from_avatarColor, fu.rating as from_rating, fu.badge as from_badge,
           tu.name as to_name, tu.avatarColor as to_avatarColor, tu.rating as to_rating, tu.badge as to_badge
    FROM exchanges e
    LEFT JOIN skills s ON e.skillId = s.id
    LEFT JOIN users fu ON e.fromUserId = fu.id
    LEFT JOIN users tu ON e.toUserId = tu.id
    WHERE e.id = ?
  `).get(id) as any;
  if (!row) return null;
  return mapExchange(row);
}

export function getExchangesByUserId(userId: number): (Exchange & { skill?: Skill; fromUser?: User; toUser?: User })[] {
  const rows = db.prepare(`
    SELECT e.*,
           s.category as skill_category, s.title as skill_title, s.description as skill_description,
           fu.name as from_name, fu.avatarColor as from_avatarColor, fu.rating as from_rating, fu.badge as from_badge,
           tu.name as to_name, tu.avatarColor as to_avatarColor, tu.rating as to_rating, tu.badge as to_badge
    FROM exchanges e
    LEFT JOIN skills s ON e.skillId = s.id
    LEFT JOIN users fu ON e.fromUserId = fu.id
    LEFT JOIN users tu ON e.toUserId = tu.id
    WHERE e.fromUserId = ? OR e.toUserId = ?
    ORDER BY e.createdAt DESC
  `).all(userId, userId) as any[];
  return rows.map(mapExchange);
}

export function updateExchangeStatus(id: number, status: Exchange['status']) {
  db.prepare('UPDATE exchanges SET status = ? WHERE id = ?').run(status, id);
  return getExchangeById(id);
}

export function getSchedule(userId: number, month: number, year: number): (Exchange & { skill?: Skill; fromUser?: User; toUser?: User })[] {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0')}-01`;
  const rows = db.prepare(`
    SELECT e.*,
           s.category as skill_category, s.title as skill_title, s.description as skill_description,
           fu.name as from_name, fu.avatarColor as from_avatarColor, fu.rating as from_rating, fu.badge as from_badge,
           tu.name as to_name, tu.avatarColor as to_avatarColor, tu.rating as to_rating, tu.badge as to_badge
    FROM exchanges e
    LEFT JOIN skills s ON e.skillId = s.id
    LEFT JOIN users fu ON e.fromUserId = fu.id
    LEFT JOIN users tu ON e.toUserId = tu.id
    WHERE (e.fromUserId = ? OR e.toUserId = ?)
      AND e.status IN ('confirmed', 'completed')
      AND e.scheduledDate >= ? AND e.scheduledDate < ?
    ORDER BY e.scheduledDate, e.startTime
  `).all(userId, userId, startDate, endDate) as any[];
  return rows.map(mapExchange);
}

export function createReview(data: Omit<Review, 'id' | 'createdAt'>) {
  const existing = db.prepare('SELECT id FROM reviews WHERE exchangeId = ? AND reviewerId = ?').get(data.exchangeId, data.reviewerId);
  if (existing) throw new Error('已评价过此交换');
  db.prepare(`
    INSERT INTO reviews (exchangeId, reviewerId, revieweeId, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.exchangeId, data.reviewerId, data.revieweeId, data.rating, data.comment);

  const reviews = db.prepare('SELECT rating FROM reviews WHERE revieweeId = ?').all(data.revieweeId) as { rating: number }[];
  const count = reviews.length;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / count;
  let badge: 'bronze' | 'silver' | 'gold' = 'bronze';
  if (count >= 20 && avg >= 4.7) badge = 'gold';
  else if (count >= 10 && avg >= 4.3) badge = 'silver';
  db.prepare('UPDATE users SET rating = ?, reviewCount = ?, badge = ? WHERE id = ?').run(Number(avg.toFixed(1)), count, badge, data.revieweeId);
}

export function getReviewByExchangeAndReviewer(exchangeId: number, reviewerId: number): Review | undefined {
  return db.prepare('SELECT * FROM reviews WHERE exchangeId = ? AND reviewerId = ?').get(exchangeId, reviewerId) as Review | undefined;
}

export function registerUser(name: string): User {
  const colors = ['#4A6741', '#8B4513', '#2E86AB', '#C1666B', '#D4A574', '#6B5B95', '#E26D5C', '#2A9D8F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const result = db.prepare('INSERT INTO users (name, avatarColor) VALUES (?, ?)').run(name, color);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)) as User;
}

export function getUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

function mapExchange(row: any): Exchange & { skill?: Skill; fromUser?: User; toUser?: User } {
  return {
    id: row.id,
    skillId: row.skillId,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    scheduledDate: row.scheduledDate,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    createdAt: row.createdAt,
    skill: row.skill_category ? {
      id: row.skillId,
      userId: row.toUserId,
      category: row.skill_category,
      title: row.skill_title,
      description: row.skill_description,
      availability: '',
      radius: 0
    } : undefined,
    fromUser: row.from_name ? {
      id: row.fromUserId,
      name: row.from_name,
      avatarColor: row.from_avatarColor,
      rating: row.from_rating,
      badge: row.from_badge,
      reviewCount: 0,
      lat: 0,
      lng: 0
    } : undefined,
    toUser: row.to_name ? {
      id: row.toUserId,
      name: row.to_name,
      avatarColor: row.to_avatarColor,
      rating: row.to_rating,
      badge: row.to_badge,
      reviewCount: 0,
      lat: 0,
      lng: 0
    } : undefined
  };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default db;
