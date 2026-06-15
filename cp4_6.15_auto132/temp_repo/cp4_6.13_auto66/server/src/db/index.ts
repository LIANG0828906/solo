import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'coffee.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      name TEXT NOT NULL,
      bean_type TEXT NOT NULL,
      grind_level TEXT NOT NULL,
      water_temp INTEGER NOT NULL,
      pour_method TEXT NOT NULL,
      steps TEXT NOT NULL,
      image TEXT,
      average_rating REAL DEFAULT 0,
      vote_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(recipe_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      bean_type TEXT NOT NULL,
      tool TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenge_submissions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      total_rating REAL DEFAULT 0,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      UNIQUE(challenge_id, user_id)
    );
  `);

  seedData();
};

const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const now = new Date().toISOString();

  const hashedPassword1 = bcrypt.hashSync('password123', 10);
  const hashedPassword2 = bcrypt.hashSync('password456', 10);

  const userId1 = uuidv4();
  const userId2 = uuidv4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, password, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run(userId1, '咖啡大师', 'master@coffee.com', hashedPassword1, now);
  insertUser.run(userId2, '手冲新手', 'newbie@coffee.com', hashedPassword2, now);

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (id, user_id, username, name, bean_type, grind_level, water_temp, pour_method, steps, image, average_rating, vote_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const recipes = [
    {
      id: uuidv4(),
      userId: userId1,
      username: '咖啡大师',
      name: '经典耶加雪菲手冲',
      beanType: '耶加雪菲',
      grindLevel: '中细研磨',
      waterTemp: 92,
      pourMethod: 'V60',
      steps: JSON.stringify([
        { description: '闷蒸：注入30g水，等待30秒', waterAmount: 30, time: 30 },
        { description: '第一段注水：缓慢注入120g水', waterAmount: 120, time: 60 },
        { description: '第二段注水：注入100g水至总量250g', waterAmount: 100, time: 90 }
      ]),
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
      averageRating: 4.5,
      voteCount: 2
    },
    {
      id: uuidv4(),
      userId: userId2,
      username: '手冲新手',
      name: '曼特宁深烘体验',
      beanType: '曼特宁',
      grindLevel: '中研磨',
      waterTemp: 94,
      pourMethod: '爱乐压',
      steps: JSON.stringify([
        { description: '倒入咖啡粉，加入200g热水', waterAmount: 200, time: 60 },
        { description: '搅拌10次', waterAmount: 0, time: 10 },
        { description: '盖上盖子，缓慢下压30秒', waterAmount: 0, time: 30 }
      ]),
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
      averageRating: 4.0,
      voteCount: 1
    }
  ];

  recipes.forEach(r => {
    insertRecipe.run(
      r.id, r.userId, r.username, r.name, r.beanType, r.grindLevel,
      r.waterTemp, r.pourMethod, r.steps, r.image, r.averageRating, r.voteCount, now
    );
  });

  const insertVote = db.prepare(`
    INSERT INTO votes (id, recipe_id, user_id, username, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertVote.run(uuidv4(), recipes[0].id, userId2, '手冲新手', 5, '非常棒的配方！风味层次分明', now);
  insertVote.run(uuidv4(), recipes[0].id, userId1, '咖啡大师', 4, '还不错，水温可以再低一点', now);
  insertVote.run(uuidv4(), recipes[1].id, userId1, '咖啡大师', 4, '新手能做到这个程度很不错', now);

  const insertComment = db.prepare(`
    INSERT INTO comments (id, recipe_id, user_id, username, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertComment.run(uuidv4(), recipes[0].id, userId2, '手冲新手', '请问这个配方的粉水比是多少？', now);
  insertComment.run(uuidv4(), recipes[0].id, userId1, '咖啡大师', '1:15左右，15g粉配225g水', now);
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const BEAN_TYPES = ['耶加雪菲', '曼特宁', '哥伦比亚', '巴西', '肯尼亚', '危地马拉', '埃塞俄比亚', '巴拿马'];
const TOOLS = ['V60', '虹吸壶', '爱乐压'];

const ensureTodayChallenge = (): any => {
  const today = getTodayDate();
  const existing = db.prepare('SELECT * FROM challenges WHERE date = ?').get(today);

  if (existing) return existing;

  const beanType = BEAN_TYPES[Math.floor(Math.random() * BEAN_TYPES.length)];
  const tool = TOOLS[Math.floor(Math.random() * TOOLS.length)];
  const description = `今日挑战：使用 ${tool} 冲煮 ${beanType} 咖啡豆，展现你的创意！`;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO challenges (id, date, bean_type, tool, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, today, beanType, tool, description);

  return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
};

export { db, initDb, ensureTodayChallenge };
export default db;
