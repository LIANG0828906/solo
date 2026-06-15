import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'studio.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      avatar_color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS artworks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      author_id TEXT NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_url TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      capacity INTEGER NOT NULL DEFAULT 10,
      booked INTEGER NOT NULL DEFAULT 0,
      schedule TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      artwork_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      artwork_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(artwork_id, user_id),
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(course_id, user_id),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedData();
  }

  console.log('✅ 数据库初始化完成');
}

function seedData() {
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, nickname, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const hashedPwd = bcrypt.hashSync('123456', 10);

  insertUser.run('u_teacher1', 'teacher1', hashedPwd, '林老师', 'teacher', '#D2691E');
  insertUser.run('u_teacher2', 'teacher2', hashedPwd, '苏老师', 'teacher', '#CD853F');
  insertUser.run('u_student1', 'student1', hashedPwd, '小画家', 'student', '#DEB887');
  insertUser.run('u_student2', 'student2', hashedPwd, '画画爱好者', 'student', '#F4A460');

  const insertArtwork = db.prepare(
    'INSERT INTO artworks (id, title, description, image_url, thumbnail_url, author_id, likes, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const artworks = [
    { id: 'a1', title: '晨曦中的花海', desc: '清晨的阳光洒在薰衣草花田，浪漫而宁静', author: 'u_student1', likes: 24 },
    { id: 'a2', title: '古镇水乡', desc: '江南水乡的小桥流水，水墨意境', author: 'u_student2', likes: 38 },
    { id: 'a3', title: '静物·陶罐与水果', desc: '古典素描静物练习，光影细腻', author: 'u_student1', likes: 15 },
    { id: 'a4', title: '星空下的小屋', desc: '梦幻的星空，温暖的小屋', author: 'u_student2', likes: 52 },
    { id: 'a5', title: '人物速写', desc: '咖啡厅里的陌生人，15分钟速写', author: 'u_student1', likes: 9 },
    { id: 'a6', title: '海边落日', desc: '金色夕阳洒满海面，波光粼粼', author: 'u_student2', likes: 67 }
  ];

  artworks.forEach(a => {
    const img = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(a.desc + ' 精美绘画作品')}&image_size=square_hd`;
    const thumb = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(a.desc + ' 缩略图')}&image_size=square`;
    insertArtwork.run(a.id, a.title, a.desc, img, thumb, a.author, a.likes, 1);
  });

  const insertCourse = db.prepare(
    'INSERT INTO courses (id, name, description, cover_url, teacher_id, price, capacity, booked, schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const courses = [
    { id: 'c1', name: '水彩画基础入门', desc: '从零开始学习水彩画，掌握颜料调和、湿画法与干画法技巧，完成3幅入门作品。适合零基础学员。', tid: 'u_teacher1', price: 299, cap: 12, booked: 7, schedule: '每周六 上午 9:00-11:30 · 共8课时' },
    { id: 'c2', name: '素描静物班', desc: '系统学习素描基础知识，包括线条、透视、光影、构图，提升造型能力与观察力。', tid: 'u_teacher2', price: 399, cap: 10, booked: 10, schedule: '每周日 下午 14:00-17:00 · 共10课时' },
    { id: 'c3', name: '油画风景创作', desc: '带领学员走进自然，用油画记录风景之美。学习油画材料、色彩搭配与刮刀技法。', tid: 'u_teacher1', price: 599, cap: 8, booked: 3, schedule: '每周三 晚上 18:30-21:00 · 共12课时' },
    { id: 'c4', name: '儿童创意绘画', desc: '通过趣味主题激发孩子创造力，结合多种材料进行创作，培养艺术兴趣与表达能力。', tid: 'u_teacher2', price: 199, cap: 15, booked: 6, schedule: '每周六 下午 15:00-16:30 · 共8课时' }
  ];

  courses.forEach(c => {
    const cover = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(c.name + ' 课程封面 文艺风格')}&image_size=landscape_4_3`;
    insertCourse.run(c.id, c.name, c.desc, cover, c.tid, c.price, c.cap, c.booked, c.schedule);
  });

  const insertComment = db.prepare(
    'INSERT INTO comments (id, artwork_id, user_id, content) VALUES (?, ?, ?, ?)'
  );
  insertComment.run('cm1', 'a1', 'u_teacher1', '光线处理得很好，前景可以再深入刻画一下~');
  insertComment.run('cm2', 'a1', 'u_student2', '太喜欢这个色调了，请问用的什么颜料？');
  insertComment.run('cm3', 'a2', 'u_teacher1', '水墨韵味十足，留白处理得很有韵味！');
  insertComment.run('cm4', 'a4', 'u_student1', '星空的笔触好梦幻，学到了！');
}

export default db;
