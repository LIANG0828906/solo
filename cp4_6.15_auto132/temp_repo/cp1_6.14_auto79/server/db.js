import { LowSync, JSONFileSync } from 'lowdb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbDir = __dirname;
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const file = join(dbDir, 'db.json');
const adapter = new JSONFileSync(file);

const defaultData = {
  users: [
    { id: 'user-1', nickname: '晨曦小鹿', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=deer', schedule: 'early', cleanliness: 'tidy', social: 'solo', budgetMin: 1500, budgetMax: 2500 },
    { id: 'user-2', nickname: '夜行者墨', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ink', schedule: 'night', cleanliness: 'flexible', social: 'outgoing', budgetMin: 2000, budgetMax: 3500 },
    { id: 'user-3', nickname: '阳光橘子', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=orange', schedule: 'early', cleanliness: 'flexible', social: 'outgoing', budgetMin: 1200, budgetMax: 2200 },
    { id: 'user-4', nickname: '静谧海盐', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=salt', schedule: 'early', cleanliness: 'tidy', social: 'outgoing', budgetMin: 2500, budgetMax: 4000 },
    { id: 'user-5', nickname: '月光猫咪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat', schedule: 'night', cleanliness: 'tidy', social: 'solo', budgetMin: 1800, budgetMax: 3000 },
    { id: 'user-6', nickname: '清风松林', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pine', schedule: 'early', cleanliness: 'flexible', social: 'solo', budgetMin: 1000, budgetMax: 1800 },
    { id: 'user-7', nickname: '暖阳咖啡', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coffee', schedule: 'night', cleanliness: 'tidy', social: 'outgoing', budgetMin: 2200, budgetMax: 3800 },
    { id: 'user-8', nickname: '星辰旅人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=star', schedule: 'night', cleanliness: 'flexible', social: 'solo', budgetMin: 1600, budgetMax: 2800 },
    { id: 'user-me', nickname: '我', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me', schedule: 'early', cleanliness: 'tidy', social: 'outgoing', budgetMin: 1500, budgetMax: 3000 },
  ],
  houses: [
    {
      id: 'house-1',
      address: '上海市徐汇区衡山路 888 号 · 梧桐公寓 3 栋 502',
      totalRent: 8800,
      memberIds: ['user-me', 'user-1', 'user-4', 'user-5'],
    },
  ],
  duties: [],
  groceries: [
    { id: 'g-1', houseId: 'house-1', name: '洗衣液', price: 45, done: false, createdAt: new Date().toISOString() },
    { id: 'g-2', houseId: 'house-1', name: '厨房纸巾', price: 28, done: true, createdAt: new Date().toISOString() },
    { id: 'g-3', houseId: 'house-1', name: '桶装水', price: 30, done: false, createdAt: new Date().toISOString() },
  ],
  ratings: [
    {
      id: 'r-1',
      fromUserId: 'user-me',
      toUserId: 'user-1',
      dimensions: { punctuality: 9, cleanliness: 10, friendliness: 8, quietness: 9, sharing: 8 },
      comment: '作息非常规律，公共区域总是收拾得很干净，偶尔会分享烘焙的小蛋糕，是非常棒的室友！',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'r-2',
      fromUserId: 'user-1',
      toUserId: 'user-me',
      dimensions: { punctuality: 8, cleanliness: 9, friendliness: 9, quietness: 8, sharing: 9 },
      comment: '采买清单记得很清楚，分摊房租从不拖延，相处起来很舒服。',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'r-3',
      fromUserId: 'user-me',
      toUserId: 'user-4',
      dimensions: { punctuality: 7, cleanliness: 8, friendliness: 10, quietness: 6, sharing: 9 },
      comment: '社交达人级别的存在，周末组织桌游局超有趣！就是偶尔看电影声音有点大～',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'r-4',
      fromUserId: 'user-me',
      toUserId: 'user-5',
      dimensions: { punctuality: 8, cleanliness: 7, friendliness: 7, quietness: 10, sharing: 6 },
      comment: '非常安静的室友，几乎不打扰别人，独立空间感保持得很好。',
      createdAt: new Date().toISOString(),
    },
  ],
};

const db = new LowSync(adapter);

if (!fs.existsSync(file)) {
  db.data = JSON.parse(JSON.stringify(defaultData));
  db.write();
} else {
  db.read();
  if (!db.data || !db.data.users || db.data.users.length === 0) {
    db.data = JSON.parse(JSON.stringify(defaultData));
    db.write();
  }
}

function generateDuties() {
  if (!db.data) return;
  if (db.data.duties.length > 0) return;
  const house = db.data.houses[0];
  if (!house) return;
  const members = house.memberIds;
  const areas = ['客厅', '厨房', '卫生间'];
  const today = new Date();
  for (let i = -3; i < 12; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    areas.forEach((area, idx) => {
      const userIdx = ((i + idx) % members.length + members.length) % members.length;
      db.data.duties.push({
        id: uuidv4(),
        houseId: house.id,
        date: dateStr,
        userId: members[userIdx],
        area,
      });
    });
  }
  db.write();
}

generateDuties();

export function getCollection(name) {
  db.read();
  return db.data ? db.data[name] || [] : [];
}

export function createItem(collection, item) {
  db.read();
  if (!db.data) db.data = { [collection]: [] };
  if (!db.data[collection]) db.data[collection] = [];
  const newItem = { id: uuidv4(), ...item };
  db.data[collection].push(newItem);
  db.write();
  return newItem;
}

export function updateItem(collection, id, updates) {
  db.read();
  if (!db.data || !db.data[collection]) return null;
  const idx = db.data[collection].findIndex((i) => i.id === id);
  if (idx === -1) return null;
  db.data[collection][idx] = { ...db.data[collection][idx], ...updates };
  db.write();
  return db.data[collection][idx];
}

export function deleteItem(collection, id) {
  db.read();
  if (!db.data || !db.data[collection]) return false;
  const before = db.data[collection].length;
  db.data[collection] = db.data[collection].filter((i) => i.id !== id);
  db.write();
  return db.data[collection].length < before;
}

export function findUserById(id) {
  db.read();
  return db.data?.users?.find((u) => u.id === id) || null;
}

export { db };
