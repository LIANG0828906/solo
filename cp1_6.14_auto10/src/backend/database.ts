import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  createdAt: number;
}

export interface Activity {
  id: string;
  groupId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: number;
}

export interface Registration {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  createdAt: number;
}

export interface Rating {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  score: number;
  comment: string;
  createdAt: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    leader_id TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    member_count INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (leader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    location TEXT NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
    comment TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE(activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const defaultUser = db.prepare('SELECT * FROM users WHERE id = ?').get('user-001') as User | undefined;
if (!defaultUser) {
  db.prepare('INSERT INTO users (id, name, avatar) VALUES (?, ?, ?)').run(
    'user-001',
    '测试用户',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user001'
  );
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
  };
}

function rowToGroup(row: any): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image,
    leaderId: row.leader_id,
    leaderName: row.leader_name,
    memberCount: row.member_count,
    createdAt: row.created_at,
  };
}

function rowToActivity(row: any): Activity {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    description: row.description || '',
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    maxParticipants: row.max_participants,
    currentParticipants: row.current_participants,
    status: row.status as 'upcoming' | 'ongoing' | 'ended',
    createdAt: row.created_at,
  };
}

function rowToRegistration(row: any): Registration {
  return {
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    userName: row.user_name,
    createdAt: row.created_at,
  };
}

function rowToRating(row: any): Rating {
  return {
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    userName: row.user_name,
    score: row.score,
    comment: row.comment || '',
    createdAt: row.created_at,
  };
}

export function getUserById(id: string): User | undefined {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row ? rowToUser(row) : undefined;
}

export function getGroups(page: number = 1, pageSize: number = 20): PaginatedResult<Group> {
  const offset = (page - 1) * pageSize;
  const rows = db.prepare('SELECT * FROM groups ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as any[];
  const total = (db.prepare('SELECT COUNT(*) as count FROM groups').get() as any).count;
  return {
    items: rows.map(rowToGroup),
    total,
    page,
    pageSize,
  };
}

export function getGroupById(id: string): Group | undefined {
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  return row ? rowToGroup(row) : undefined;
}

export function createGroup(params: {
  name: string;
  description: string;
  coverImage: string;
  leaderId: string;
  leaderName: string;
}): Group {
  const id = uuidv4();
  const createdAt = Date.now();
  db.prepare(
    'INSERT INTO groups (id, name, description, cover_image, leader_id, leader_name, member_count,