import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'study-tracker-secret-key-2024';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = new Database(path.join(__dirname, 'study-tracker.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    reminder_time TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    weekly_goal_hours REAL NOT NULL DEFAULT 5,
    color TEXT NOT NULL DEFAULT '#7c6fff',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);

  CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    rating INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, start_time);
  CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    level TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, type, level)
  );
  CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
`);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
};

const safeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

const checkAndUnlockAchievements = (userId) => {
  const newAchievements = [];

  const totalHoursRow = db
    .prepare(
      'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM study_sessions WHERE user_id = ?'
    )
    .get(userId);
  const totalHours = totalHoursRow.total / 3600;

  const hourThresholds = [
    { threshold: 10, level: 'extra1', name: '探索者', desc: '累计学习10小时' },
    { threshold: 50, level: 'extra2', name: '耕耘者', desc: '累计学习50小时' },
    { threshold: 100, level: 'extra3', name: '精通者', desc: '累计学习100小时' },
  ];

  for (const t of hourThresholds) {
    if (totalHours >= t.threshold) {
      const existing = db
        .prepare("SELECT id FROM achievements WHERE user_id = ? AND type = 'hours' AND level = ?")
        .get(userId, t.level);
      if (!existing) {
        const info = db
          .prepare(
            "INSERT INTO achievements (user_id, type, level, name, description) VALUES (?, 'hours', ?, ?, ?)"
          )
          .run(userId, t.level, t.name, t.desc);
        newAchievements.push({
          id: info.lastInsertRowid,
          type: 'hours',
          level: t.level,
          name: t.name,
          description: t.desc,
        });
      }
    }
  }

  const sessions = db
    .prepare(
      'SELECT DATE(start_time) as dt, SUM(duration_seconds) as dur FROM study_sessions WHERE user_id = ? GROUP BY DATE(start_time) HAVING dur >= 1800 ORDER BY dt DESC'
    )
    .all(userId);

  const daysSet = new Set(sessions.map((s) => s.dt));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (daysSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const streakThresholds = [
    { threshold: 3, level: 'bronze', name: '铜质坚持', desc: '连续学习3天' },
    { threshold: 7, level: 'silver', name: '银质坚持', desc: '连续学习7天' },
    { threshold: 30, level: 'gold', name: '金质坚持', desc: '连续学习30天' },
  ];

  for (const t of streakThresholds) {
    if (streak >= t.threshold) {
      const existing = db
        .prepare("SELECT id FROM achievements WHERE user_id = ? AND type = 'streak' AND level = ?")
        .get(userId, t.level);
      if (!existing) {
        const info = db
          .prepare(
            "INSERT INTO achievements (user_id, type, level, name, description) VALUES (?, 'streak', ?, ?, ?)"
          )
          .run(userId, t.level, t.name, t.desc);
        newAchievements.push({
          id: info.lastInsertRowid,
          type: 'streak',
          level: t.level,
          name: t.name,
          description: t.desc,
        });
      }
    }
  }

  return newAchievements;
};

app.post('/api/register', (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password || !nickname) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    const hashed = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)')
      .run(username, hashed, nickname);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    const defaultSubjects = [
      { name: '编程', color: '#7c6fff', weekly: 5 },
      { name: '数学', color: '#f5c542', weekly: 4 },
      { name: '英语', color: '#22c55e', weekly: 3 },
    ];
    for (const s of defaultSubjects) {
      db.prepare(
        'INSERT INTO subjects (user_id, name, weekly_goal_hours, color) VALUES (?, ?, ?, ?)'
      ).run(user.id, s.name, s.weekly, s.color);
    }

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请填写用户名和密码' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/subjects', authMiddleware, (req, res) => {
  try {
    const subjects = db
      .prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/subjects', authMiddleware, (req, res) => {
  try {
    const { name, weekly_goal_hours, color } = req.body;
    if (!name) return res.status(400).json({ error: '科目名称必填' });
    const info = db
      .prepare(
        'INSERT INTO subjects (user_id, name, weekly_goal_hours, color) VALUES (?, ?, ?, ?)'
      )
      .run(req.user.id, name, weekly_goal_hours || 5, color || '#7c6fff');
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid);
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.put('/api/subjects/:id', authMiddleware, (req, res) => {
  try {
    const { name, weekly_goal_hours, color } = req.body;
    const existing = db
      .prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: '科目不存在' });
    db.prepare(
      'UPDATE subjects SET name = ?, weekly_goal_hours = ?, color = ? WHERE id = ?'
    ).run(name || existing.name, weekly_goal_hours ?? existing.weekly_goal_hours, color || existing.color, req.params.id);
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.delete('/api/subjects/:id', authMiddleware, (req, res) => {
  try {
    const existing = db
      .prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: '科目不存在' });
    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/sessions', authMiddleware, (req, res) => {
  try {
    const { start_date, end_date, search } = req.query;
    let query = 'SELECT * FROM study_sessions WHERE user_id = ?';
    const params = [req.user.id];
    if (start_date) {
      query += ' AND DATE(start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(start_time) <= ?';
      params.push(end_date);
    }
    if (search) {
      query += ' AND (notes LIKE ? OR subject_id IN (SELECT id FROM subjects WHERE name LIKE ? AND user_id = ?))';
      params.push(`%${search}%`, `%${search}%`, req.user.id);
    }
    query += ' ORDER BY start_time DESC';
    const sessions = db.prepare(query).all(...params);
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/sessions', authMiddleware, (req, res) => {
  try {
    const { subject_id, start_time, end_time, duration_seconds, notes, rating } = req.body;
    if (!subject_id || !start_time || !end_time || !duration_seconds) {
      return res.status(400).json({ error: '必填字段缺失' });
    }
    const info = db
      .prepare(
        'INSERT INTO study_sessions (user_id, subject_id, start_time, end_time, duration_seconds, notes, rating) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(req.user.id, subject_id, start_time, end_time, duration_seconds, notes || '', rating || 0);
    const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(info.lastInsertRowid);
    const newAchievements = checkAndUnlockAchievements(req.user.id);
    res.json({ session, newAchievements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/statistics', authMiddleware, (req, res) => {
  try {
    const range = parseInt(req.query.range as string) || 30;
    const userId = req.user.id;

    const today = new Date();
    const trendStart = new Date(today);
    trendStart.setDate(trendStart.getDate() - (range - 1));

    const trendData = [];
    for (let i = 0; i < range; i++) {
      const d = new Date(trendStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const row = db
        .prepare(
          "SELECT COALESCE(SUM(duration_seconds), 0) as dur FROM study_sessions WHERE user_id = ? AND DATE(start_time) = ?"
        )
        .get(userId, dateStr);
      trendData.push({ date: dateStr, hours: Number((row.dur / 3600).toFixed(2)) });
    }

    const weekStart = new Date(today);
    const dayOfWeek = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString();
    const weekEndStr = weekEnd.toISOString();

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = prevWeekStart.toISOString();
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
    prevWeekEnd.setHours(23, 59, 59, 999);
    const prevWeekEndStr = prevWeekEnd.toISOString();

    const thisWeekTotal = db
      .prepare(
        'SELECT COALESCE(SUM(duration_seconds), 0) as dur FROM study_sessions WHERE user_id = ? AND start_time >= ? AND start_time <= ?'
      )
      .get(userId, weekStartStr, weekEndStr).dur;
    const prevWeekTotal = db
      .prepare(
        'SELECT COALESCE(SUM(duration_seconds), 0) as dur FROM study_sessions WHERE user_id = ? AND start_time >= ? AND start_time <= ?'
      )
      .get(userId, prevWeekStartStr, prevWeekEndStr).dur;

    const weeklyChange =
      prevWeekTotal > 0
        ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100)
        : thisWeekTotal > 0
        ? 100
        : 0;

    const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ?').all(userId);
    const subjectBreakdown = subjects.map((s) => {
      const row = db
        .prepare(
          'SELECT COALESCE(SUM(duration_seconds), 0) as dur FROM study_sessions WHERE user_id = ? AND subject_id = ? AND start_time >= ? AND start_time <= ?'
        )
        .get(userId, s.id, weekStartStr, weekEndStr);
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        hours: Number((row.dur / 3600).toFixed(2)),
      };
    });

    const sessions = db
      .prepare(
        'SELECT DATE(start_time) as dt, SUM(duration_seconds) as dur FROM study_sessions WHERE user_id = ? GROUP BY DATE(start_time) ORDER BY dt DESC'
      )
      .all(userId);
    const daySet = new Set(sessions.filter((s) => s.dur >= 1800).map((s) => s.dt));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const ds = cur.toISOString().split('T')[0];
      if (daySet.has(ds)) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }

    const totalHoursAll = (db
      .prepare(
        'SELECT COALESCE(SUM(duration_seconds), 0) as dur FROM study_sessions WHERE user_id = ?'
      )
      .get(userId).dur / 3600);

    const encouragementList = [
      '每一步努力都在塑造更好的自己，继续加油！',
      '坚持是最好的天赋，你已经走在正确的路上！',
      '知识的积累终将绽放，别停下脚步！',
      '今天的汗水，是明天的底气！',
      '学习是唯一不会贬值的投资，为你骄傲！',
      '你远比自己想象中更优秀，继续前行！',
    ];
    const encouragement = encouragementList[Math.floor(Math.random() * encouragementList.length)];

    res.json({
      trend: trendData,
      weekly: {
        totalHours: Number((thisWeekTotal / 3600).toFixed(2)),
        prevTotalHours: Number((prevWeekTotal / 3600).toFixed(2)),
        changePercent: weeklyChange,
        subjectBreakdown,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        encouragement,
      },
      streak,
      totalHours: Number(totalHoursAll.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/achievements', authMiddleware, (req, res) => {
  try {
    const achievements = db
      .prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC')
      .all(req.user.id);
    res.json(achievements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.put('/api/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar, reminder_time } = req.body;
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!existing) return res.status(404).json({ error: '用户不存在' });
    db.prepare(
      'UPDATE users SET nickname = ?, avatar = ?, reminder_time = ? WHERE id = ?'
    ).run(
      nickname ?? existing.nickname,
      avatar ?? existing.avatar,
      reminder_time ?? existing.reminder_time,
      req.user.id
    );
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json(safeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/export-pdf', authMiddleware, (req, res) => {
  try {
    const { week_start } = req.body;
    const userId = req.user.id;
    res.json({ success: true, week_start: week_start || 'current', message: 'PDF导出数据准备完成' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Study Tracker API server running on http://localhost:${PORT}`);
});
