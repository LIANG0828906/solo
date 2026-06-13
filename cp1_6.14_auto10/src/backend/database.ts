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

export function getCurrentUser(): User {
  const user = getUserById('user-001');
  if (!user) {
    throw new Error('默认用户不存在');
  }
  return user;
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
    'INSERT INTO groups (id, name, description, cover_image, leader_id, leader_name, member_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
  ).run(
    id,
    params.name,
    params.description,
    params.coverImage,
    params.leaderId,
    params.leaderName,
    createdAt
  );
  const group = getGroupById(id);
  if (!group) {
    throw new Error('创建小组失败');
  }
  return group;
}

export function updateGroup(
  id: string,
  params: Partial<{ name: string; description: string; coverImage: string }>
): Group {
  const existing = getGroupById(id);
  if (!existing) {
    throw new Error('小组不存在');
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (params.name !== undefined) {
    fields.push('name = ?');
    values.push(params.name);
  }
  if (params.description !== undefined) {
    fields.push('description = ?');
    values.push(params.description);
  }
  if (params.coverImage !== undefined) {
    fields.push('cover_image = ?');
    values.push(params.coverImage);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = getGroupById(id);
  if (!updated) {
    throw new Error('更新小组失败');
  }
  return updated;
}

export function deleteGroup(id: string): void {
  const existing = getGroupById(id);
  if (!existing) {
    throw new Error('小组不存在');
  }

  const transaction = db.transaction(() => {
    const activityIds = db.prepare('SELECT id FROM activities WHERE group_id = ?').all(id) as any[];
    for (const row of activityIds) {
      db.prepare('DELETE FROM registrations WHERE activity_id = ?').run(row.id);
      db.prepare('DELETE FROM ratings WHERE activity_id = ?').run(row.id);
    }
    db.prepare('DELETE FROM activities WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  });

  transaction();
}

export function getActivities(
  groupId: string,
  page: number = 1,
  pageSize: number = 20
): PaginatedResult<Activity> {
  const offset = (page - 1) * pageSize;
  const rows = db.prepare(
    'SELECT * FROM activities WHERE group_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(groupId, pageSize, offset) as any[];
  const total = (db.prepare('SELECT COUNT(*) as count FROM activities WHERE group_id = ?').get(groupId) as any).count;
  return {
    items: rows.map(rowToActivity),
    total,
    page,
    pageSize,
  };
}

export function getActivityById(id: string): Activity | undefined {
  const row = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  return row ? rowToActivity(row) : undefined;
}

export function createActivity(params: {
  groupId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  location: string;
  maxParticipants: number;
}): Activity {
  const group = getGroupById(params.groupId);
  if (!group) {
    throw new Error('小组不存在');
  }

  const id = uuidv4();
  const createdAt = Date.now();
  const now = Date.now();
  let status: 'upcoming' | 'ongoing' | 'ended' = 'upcoming';
  if (now > params.endTime) {
    status = 'ended';
  } else if (now >= params.startTime) {
    status = 'ongoing';
  }

  db.prepare(
    'INSERT INTO activities (id, group_id, title, description, start_time, end_time, location, max_participants, current_participants, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
  ).run(
    id,
    params.groupId,
    params.title,
    params.description,
    params.startTime,
    params.endTime,
    params.location,
    params.maxParticipants,
    status,
    createdAt
  );

  const activity = getActivityById(id);
  if (!activity) {
    throw new Error('创建活动失败');
  }
  return activity;
}

export function registerActivity(
  activityId: string,
  userId: string,
  userName: string
): Registration {
  const activity = getActivityById(activityId);
  if (!activity) {
    throw new Error('活动不存在');
  }

  if (activity.currentParticipants >= activity.maxParticipants) {
    throw new Error('活动名额已满');
  }

  const existing = db.prepare('SELECT * FROM registrations WHERE activity_id = ? AND user_id = ?').get(activityId, userId);
  if (existing) {
    throw new Error('您已报名该活动');
  }

  const transaction = db.transaction(() => {
    const id = uuidv4();
    const createdAt = Date.now();
    db.prepare(
      'INSERT INTO registrations (id, activity_id, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, activityId, userId, userName, createdAt);

    db.prepare('UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?').run(activityId);

    const row = db.prepare('SELECT * FROM registrations WHERE id = ?').get(id);
    return rowToRegistration(row);
  });

  return transaction();
}

export function unregisterActivity(activityId: string, userId: string): void {
  const existing = db.prepare('SELECT * FROM registrations WHERE activity_id = ? AND user_id = ?').get(activityId, userId);
  if (!existing) {
    throw new Error('您未报名该活动');
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM registrations WHERE activity_id = ? AND user_id = ?').run(activityId, userId);
    db.prepare('UPDATE activities SET current_participants = current_participants - 1 WHERE id = ?').run(activityId);
  });

  transaction();
}

export function isRegistered(activityId: string, userId: string): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE activity_id = ? AND user_id = ?').get(activityId, userId);
  return (row as any).count > 0;
}

export function getRatings(activityId: string): Rating[] {
  const rows = db.prepare('SELECT * FROM ratings WHERE activity_id = ? ORDER BY created_at DESC').all(activityId) as any[];
  return rows.map(rowToRating);
}

export function createRating(params: {
  activityId: string;
  userId: string;
  userName: string;
  score: number;
  comment: string;
}): Rating {
  if (params.score < 1 || params.score > 5) {
    throw new Error('评分必须在1-5之间');
  }

  const activity = getActivityById(params.activityId);
  if (!activity) {
    throw new Error('活动不存在');
  }

  const existing = db.prepare('SELECT * FROM ratings WHERE activity_id = ? AND user_id = ?').get(params.activityId, params.userId);
  if (existing) {
    throw new Error('您已对该活动进行过评分');
  }

  const id = uuidv4();
  const createdAt = Date.now();
  db.prepare(
    'INSERT INTO ratings (id, activity_id, user_id, user_name, score, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    params.activityId,
    params.userId,
    params.userName,
    params.score,
    params.comment,
    createdAt
  );

  const rating = db.prepare('SELECT * FROM ratings WHERE id = ?').get(id);
  if (!rating) {
    throw new Error('创建评分失败');
  }
  return rowToRating(rating);
}

export function getGroupsByUserId(userId: string): Group[] {
  const rows = db.prepare('SELECT * FROM groups WHERE leader_id = ? ORDER BY created_at DESC').all(userId) as any[];
  return rows.map(rowToGroup);
}

export function getActivitiesByUserId(userId: string): Activity[] {
  const rows = db.prepare(
    `SELECT a.* FROM activities a
     INNER JOIN registrations r ON a.id = r.activity_id
     WHERE r.user_id = ?
     ORDER BY a.created_at DESC`
  ).all(userId) as any[];
  return rows.map(rowToActivity);
}

export function getRatingsByUserId(userId: string): Rating[] {
  const rows = db.prepare('SELECT * FROM ratings WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
  return rows.map(rowToRating);
}

export function hasActivities(groupId: string): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM activities WHERE group_id = ?').get(groupId);
  return (row as any).count > 0;
}

export default db;
