import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '..', 'library.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seats (
    id TEXT PRIMARY KEY,
    seat_number TEXT NOT NULL,
    floor INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    current_user_id TEXT,
    occupied_at DATETIME,
    FOREIGN KEY (current_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seat_id TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    floor INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seat_id TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
  );

  CREATE TABLE IF NOT EXISTS active_sessions (
    user_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    seat_id TEXT,
    start_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminUser) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const { v4: uuidv4 } = require('uuid');
  db.prepare(
    'INSERT INTO users (id, username, password, nickname, role) VALUES (?, ?, ?, ?, ?)'
  ).run(uuidv4(), 'admin', hashedPassword, '系统管理员', 'admin');
}

const seatCount = db.prepare('SELECT COUNT(*) as count FROM seats').get() as { count: number };
if (seatCount.count === 0) {
  const { v4: uuidv4 } = require('uuid');
  const insertSeat = db.prepare(
    'INSERT INTO seats (id, seat_number, floor, status) VALUES (?, ?, ?, ?)'
  );
  for (let floor = 1; floor <= 3; floor++) {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const seatNumber = `${floor}F-${String.fromCharCode(65 + row)}${col + 1}`;
        insertSeat.run(uuidv4(), seatNumber, floor, 'available');
      }
    }
  }
}

export default db;
