import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';


import toursRouter from './routes/tours';
import songsRouter from './routes/songs';
import membersRouter from './routes/members';

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'tours.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export { db };

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      band_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (band_id) REFERENCES bands(id)
    );

    CREATE TABLE IF NOT EXISTS tours (
      id TEXT PRIMARY KEY,
      band_id TEXT NOT NULL,
      name TEXT NOT NULL,
      route_color TEXT DEFAULT '#3498db',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (band_id) REFERENCES bands(id)
    );

    CREATE TABLE IF NOT EXISTS setlists (
      id TEXT PRIMARY KEY,
      tour_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'main',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tour_id) REFERENCES tours(id)
    );

    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      setlist_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      duration_sec INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (setlist_id) REFERENCES setlists(id)
    );

    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      tour_id TEXT NOT NULL,
      name TEXT NOT NULL,
      venue TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT DEFAULT '20:00',
      lat REAL,
      lng REAL,
      order_index INTEGER DEFAULT 0,
      main_setlist_id TEXT,
      encore_setlist_id TEXT,
      FOREIGN KEY (tour_id) REFERENCES tours(id),
      FOREIGN KEY (main_setlist_id) REFERENCES setlists(id),
      FOREIGN KEY (encore_setlist_id) REFERENCES setlists(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      status TEXT DEFAULT '待定',
      note TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(city_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS member_schedules (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );
  `);

  const bandCount = db.prepare('SELECT COUNT(*) as count FROM bands').get() as { count: number };
  if (bandCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const insertBand = db.prepare('INSERT INTO bands (id, name) VALUES (?, ?)');
  insertBand.run('band-1', '极光乐队');

  const insertMember = db.prepare('INSERT INTO members (id, band_id, name, email, role) VALUES (?, ?, ?, ?, ?)');
  const memberNames = ['林星辰', '陆南风', '云若溪', '雷鸣远', '苏雨桐'];
  const memberRoles = ['主唱', '吉他', '贝斯', '鼓', '键盘'];
  for (let i = 0; i < 5; i++) {
    insertMember.run(
      `member-${i + 1}`,
      'band-1',
      memberNames[i],
      `${memberNames[i]}@aurora.cn`,
      memberRoles[i]
    );
  }

  const insertTour = db.prepare('INSERT INTO tours (id, band_id, name, route_color) VALUES (?, ?, ?, ?)');
  insertTour.run('tour-1', 'band-1', '2026夏季全国巡演', '#9b59b6');

  const insertSetlist = db.prepare('INSERT INTO setlists (id, tour_id, name, type) VALUES (?, ?, ?, ?)');
  insertSetlist.run('setlist-1', 'tour-1', '主歌单-夏季', 'main');
  insertSetlist.run('setlist-2', 'tour-1', '安可歌单', 'encore');

  const insertSong = db.prepare('INSERT INTO songs (id, setlist_id, title, artist, duration_sec, order_index) VALUES (?, ?, ?, ?, ?, ?)');
  const mainSongs = [
    { title: '极光之恋', artist: '极光乐队', duration: 245 },
    { title: '夏日风暴', artist: '极光乐队', duration: 218 },
    { title: '星河漫步', artist: '极光乐队', duration: 276 },
    { title: '城市烟火', artist: '极光乐队', duration: 198 },
    { title: '逆风飞翔', artist: '极光乐队', duration: 232 },
    { title: '午夜梦回', artist: '极光乐队', duration: 301 },
    { title: '远方的呼唤', artist: '极光乐队', duration: 254 },
    { title: '雨后彩虹', artist: '极光乐队', duration: 223 },
    { title: '追梦赤子心', artist: '极光乐队', duration: 287 },
    { title: '北极光', artist: '极光乐队', duration: 265 },
  ];
  mainSongs.forEach((song, index) => {
    insertSong.run(
      `song-main-${index + 1}`,
      'setlist-1',
      song.title,
      song.artist,
      song.duration,
      index
    );
  });

  const encoreSongs = [
    { title: '永恒之光', artist: '极光乐队', duration: 298 },
    { title: '再见，夏天', artist: '极光乐队', duration: 312 },
  ];
  encoreSongs.forEach((song, index) => {
    insertSong.run(
      `song-encore-${index + 1}`,
      'setlist-2',
      song.title,
      song.artist,
      song.duration,
      index
    );
  });

  const insertCity = db.prepare(`
    INSERT INTO cities (id, tour_id, name, venue, date, time, lat, lng, order_index, main_setlist_id, encore_setlist_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const cityData = [
    { name: '北京', venue: '国家体育馆', date: '2026-07-01', lat: 39.9, lng: 116.4 },
    { name: '上海', venue: '梅赛德斯奔驰文化中心', date: '2026-07-02', lat: 31.2, lng: 121.5 },
    { name: '广州', venue: '天河体育馆', date: '2026-07-03', lat: 23.1, lng: 113.3 },
    { name: '成都', venue: '五粮液成都金融城演艺中心', date: '2026-07-04', lat: 30.6, lng: 104.1 },
    { name: '武汉', venue: '光谷国际网球中心', date: '2026-07-05', lat: 30.6, lng: 114.3 },
  ];
  cityData.forEach((city, index) => {
    insertCity.run(
      `city-${index + 1}`,
      'tour-1',
      city.name,
      city.venue,
      city.date,
      '20:00',
      city.lat,
      city.lng,
      index,
      'setlist-1',
      'setlist-2'
    );
  });

  const insertAttendance = db.prepare(`
    INSERT INTO attendance (id, city_id, member_id, status) VALUES (?, ?, ?, ?)
  `);
  for (let c = 1; c <= 5; c++) {
    for (let m = 1; m <= 5; m++) {
      insertAttendance.run(
        `att-${c}-${m}`,
        `city-${c}`,
        `member-${m}`,
        '待定'
      );
    }
  }
}

initDatabase();

const app = express();
const PORT = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() }, message: '服务正常' });
});

app.use('/api/tours', toursRouter);
app.use('/api/songs', songsRouter);
app.use('/api/members', membersRouter);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('attendance:update', (payload) => {
    console.log('attendance:update received:', payload);
    io.emit('attendance:changed', payload);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

export { io };

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Socket.IO server is running on ws://localhost:${PORT}`);
});
