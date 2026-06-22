import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new Database('./pets.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    avatar TEXT NOT NULL,
    intro TEXT NOT NULL,
    hunger INTEGER NOT NULL DEFAULT 80,
    happiness INTEGER NOT NULL DEFAULT 80,
    health INTEGER NOT NULL DEFAULT 100,
    adopted INTEGER NOT NULL DEFAULT 0,
    adopted_at TEXT,
    lost INTEGER NOT NULL DEFAULT 0,
    lost_at TEXT,
    last_action_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL,
    pet_name TEXT NOT NULL,
    pet_type TEXT NOT NULL,
    pet_thumbnail TEXT NOT NULL,
    lost_at TEXT NOT NULL,
    contact TEXT NOT NULL,
    last_snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(id)
  );

  CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
  CREATE INDEX IF NOT EXISTS idx_pets_adopted ON pets(adopted);
  CREATE INDEX IF NOT EXISTS idx_notices_pet_type ON notices(pet_type);
  CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
`);

const catAvatars = ['🐱', '😺', '😸', '🐈', '🐈‍⬛', '😻'];
const dogAvatars = ['🐶', '🐕', '🐩', '🦮', '🐕‍🦺', '🐾'];
const rabbitAvatars = ['🐰', '🐇', '🐇', '🐰', '🐇', '🐰'];
const otherAvatars = ['🐹', '🐭', '🐨', '🦊', '🐼', '🐻', '🦝', '🐯'];

const catNames = ['咪咪', '橙子', '小花', '豆豆', '奶茶', '团子', '可乐', '饼干', '雪球', '栗子', '布丁', '麻薯'];
const dogNames = ['旺财', '豆豆', '小白', '球球', '可乐', '饺子', '麻团', '布丁', '薯条', '汉堡', '奶糖', '乐乐'];
const rabbitNames = ['跳跳', '棉花', '云朵', '雪球', '糯米', '汤圆', '豆沙', '奶糖', '麻薯', '肉松', '桂花', '奶茶'];
const otherNames = ['嘟嘟', '圆圆', '滚滚', '毛毛', '绒绒', '球球', '团团', '豆豆', '果果', '糖糖', '贝贝', '晶晶'];

const catIntros = [
  '喵~我是一只爱晒太阳的小猫咪，最喜欢趴在窗台上看小鸟啦！',
  '呼噜呼噜...我喜欢被摸下巴，会用小脑袋蹭你的手哦！',
  '我会用猫砂盆，也会翻跟头，是个聪明的小宝贝~',
  '喵呜！最爱小鱼干和逗猫棒，陪我玩我就跟你天下第一好！'
];
const dogIntros = [
  '汪汪！我超级热情，见人就摇尾巴，最喜欢散步了！',
  '我会坐、握手、趴下，还会捡球！聪明的小狗就是我~',
  '虽然我偶尔会拆家，但我真的很爱很爱你呀！',
  '汪！我会看家护院，也会当你的小暖炉，快带我回家吧！'
];
const rabbitIntros = [
  '我爱吃胡萝卜和青草，耳朵会转来转去听声音哦~',
  '蹦蹦跳跳真可爱！我喜欢被轻轻抚摸额头，很乖的！',
  '我会用小鼻子拱你，代表我喜欢你！棉花糖一样的兔兔~',
  '我胆子有点小，但是熟悉之后会蹦到你腿上撒娇！'
];
const otherIntros = [
  '我虽然不像猫猫狗狗，但我也有独特的可爱之处！',
  '好奇宝宝就是我！喜欢观察周围的一切，特别聪明~',
  '我喜欢吃小零食，会用大眼睛萌萌地看着你！',
  '快来认识一下特别的我吧，保证让你惊喜不断！'
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePet(type) {
  let avatars, names, intros;
  switch (type) {
    case 'cat': avatars = catAvatars; names = catNames; intros = catIntros; break;
    case 'dog': avatars = dogAvatars; names = dogNames; intros = dogIntros; break;
    case 'rabbit': avatars = rabbitAvatars; names = rabbitNames; intros = rabbitIntros; break;
    default: avatars = otherAvatars; names = otherNames; intros = otherIntros;
  }
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    user_id: null,
    name: randomItem(names),
    type,
    avatar: randomItem(avatars),
    intro: randomItem(intros),
    hunger: 75 + Math.floor(Math.random() * 20),
    happiness: 75 + Math.floor(Math.random() * 20),
    health: 95 + Math.floor(Math.random() * 5),
    adopted: 0,
    adopted_at: null,
    lost: 0,
    lost_at: null,
    last_action_at: now,
    created_at: now
  };
}

function seedDatabase() {
  const countStmt = db.prepare('SELECT COUNT(*) as cnt FROM pets WHERE adopted = 0');
  const { cnt } = countStmt.get();
  if (cnt < 12) {
    const insertPet = db.prepare(`
      INSERT INTO pets (id, user_id, name, type, avatar, intro, hunger, happiness, health, adopted, adopted_at, lost, lost_at, last_action_at, created_at)
      VALUES (@id, @user_id, @name, @type, @avatar, @intro, @hunger, @happiness, @health, @adopted, @adopted_at, @lost, @lost_at, @last_action_at, @created_at)
    `);
    const needed = 12 - cnt;
    const types = ['cat', 'cat', 'cat', 'dog', 'dog', 'dog', 'rabbit', 'rabbit', 'rabbit', 'other', 'other', 'other'];
    const transaction = db.transaction(() => {
      for (let i = 0; i < needed; i++) {
        insertPet.run(generatePet(types[i % types.length]));
      }
    });
    transaction();
    console.log(`[种子数据] 已插入 ${needed} 只待领养宠物`);
  }
}
seedDatabase();

function rowToPet(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    avatar: row.avatar,
    intro: row.intro,
    hunger: row.hunger,
    happiness: row.happiness,
    health: row.health,
    adopted: !!row.adopted,
    adoptedAt: row.adopted_at,
    lost: !!row.lost,
    lostAt: row.lost_at,
    lastActionAt: row.last_action_at,
    createdAt: row.created_at
  };
}

function rowToNotice(row) {
  if (!row) return null;
  return {
    id: row.id,
    petId: row.pet_id,
    petName: row.pet_name,
    petType: row.pet_type,
    petThumbnail: row.pet_thumbnail,
    lostAt: row.lost_at,
    contact: row.contact,
    lastSnapshot: JSON.parse(row.last_snapshot),
    createdAt: row.created_at
  };
}

app.post('/api/user/init', (req, res) => {
  const { nickname } = req.body;
  const id = uuidv4();
  const finalNickname = nickname || `爱心主人_${id.slice(0, 6)}`;
  const now = new Date().toISOString();
  db.prepare('INSERT INTO users (id, nickname, created_at) VALUES (?, ?, ?)').run(id, finalNickname, now);
  res.json({ id, nickname: finalNickname, createdAt: now });
});

app.get('/api/pets/random', (_req, res) => {
  seedDatabase();
  const rows = db.prepare('SELECT * FROM pets WHERE adopted = 0 AND lost = 0 ORDER BY RANDOM() LIMIT 12').all();
  res.json(rows.map(rowToPet));
});

app.post('/api/pets/adopt', (req, res) => {
  const { petId, userId } = req.body;
  if (!petId || !userId) return res.status(400).json({ error: '缺少参数' });
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId);
  if (!pet) return res.status(404).json({ error: '宠物不存在' });
  if (pet.adopted) return res.status(400).json({ error: '该宠物已被领养' });
  const now = new Date().toISOString();
  db.prepare('UPDATE pets SET user_id = ?, adopted = 1, adopted_at = ?, last_action_at = ? WHERE id = ?').run(userId, now, now, petId);
  const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId);
  res.json(rowToPet(updated));
});

app.get('/api/pets/mine', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: '缺少userId' });
  const rows = db.prepare('SELECT * FROM pets WHERE user_id = ? ORDER BY adopted_at DESC').all(userId);
  res.json(rows.map(rowToPet));
});

app.put('/api/pets/:id/action', (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
  if (!pet) return res.status(404).json({ error: '宠物不存在' });
  if (pet.lost) return res.status(400).json({ error: '宠物已走失' });

  let { hunger, happiness, health } = pet;
  const now = new Date().toISOString();

  switch (action) {
    case 'feed':
      hunger = Math.min(100, hunger + 25);
      happiness = Math.min(100, happiness + 5);
      if (health < 100 && hunger > 50) health = Math.min(100, health + 3);
      break;
    case 'play':
      happiness = Math.min(100, happiness + 25);
      hunger = Math.max(0, hunger - 8);
      health = Math.min(100, health + 2);
      break;
    case 'sleep':
      health = Math.min(100, health + 20);
      happiness = Math.min(100, happiness + 5);
      hunger = Math.max(0, hunger - 5);
      break;
    default:
      return res.status(400).json({ error: '未知操作' });
  }

  db.prepare('UPDATE pets SET hunger = ?, happiness = ?, health = ?, last_action_at = ? WHERE id = ?')
    .run(hunger, happiness, health, now, id);

  const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
  res.json(rowToPet(updated));
});

app.put('/api/pets/:id/decay', (req, res) => {
  const { id } = req.params;
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
  if (!pet) return res.status(404).json({ error: '宠物不存在' });
  if (!pet.adopted || pet.lost) return res.json(rowToPet(pet));

  const now = new Date();
  const lastAction = new Date(pet.last_action_at);
  const hoursDiff = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.min(hoursDiff / 12, 3);

  let { hunger, happiness, health } = pet;
  hunger = Math.max(0, hunger - Math.floor(15 * decayFactor));
  happiness = Math.max(0, happiness - Math.floor(12 * decayFactor));

  if (hunger < 20 || happiness < 20) {
    health = Math.max(0, health - Math.floor(10 * decayFactor));
  }

  let lost = pet.lost;
  let lostAt = pet.lost_at;
  let noticeCreated = false;

  if (health <= 0 && !pet.lost) {
    lost = 1;
    lostAt = now.toISOString();
    const noticeId = uuidv4();
    const snap = JSON.stringify({ hunger, happiness, health: 0 });
    db.prepare(`INSERT INTO notices (id, pet_id, pet_name, pet_type, pet_thumbnail, lost_at, contact, last_snapshot, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(noticeId, id, pet.name, pet.type, pet.avatar, lostAt, '请前往社区联系发布者', snap, now.toISOString());
    noticeCreated = true;
  }

  db.prepare('UPDATE pets SET hunger = ?, happiness = ?, health = ?, lost = ?, lost_at = ? WHERE id = ?')
    .run(hunger, happiness, health, lost ? 1 : 0, lostAt, id);

  const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
  res.json({ ...rowToPet(updated), noticeCreated });
});

app.get('/api/notices', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM notices';
  const params = [];
  if (type && type !== 'all') {
    query += ' WHERE pet_type = ?';
    params.push(type);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows.map(rowToNotice));
});

app.get('/api/notices/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM notices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '启事不存在' });
  res.json(rowToNotice(row));
});

app.post('/api/notices', (req, res) => {
  const { petId, petName, petType, petThumbnail, lostAt, contact, lastSnapshot } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  const snap = lastSnapshot ? JSON.stringify(lastSnapshot) : JSON.stringify({ hunger: 0, happiness: 0, health: 0 });
  db.prepare(`INSERT INTO notices (id, pet_id, pet_name, pet_type, pet_thumbnail, lost_at, contact, last_snapshot, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, petId, petName, petType, petThumbnail, lostAt || now, contact || '匿名', snap, now);
  const row = db.prepare('SELECT * FROM notices WHERE id = ?').get(id);
  res.status(201).json(rowToNotice(row));
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🐾 像素宠物屋后端服务已启动: http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
});
