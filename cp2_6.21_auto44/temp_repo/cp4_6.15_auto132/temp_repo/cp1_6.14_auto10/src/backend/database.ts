import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
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

let dbInstance: SqlJsDatabase | null = null;
const dbDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'app.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

async function loadDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    return new SQL.Database(buffer);
  }
  return new SQL.Database();
}

function saveDatabase() {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function rowToUser(row: Record<string, any>): User {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
  };
}

function rowToGroup(row: Record<string, any>): Group {
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

function rowToActivity(row: Record<string, any>): Activity {
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

function rowToRegistration(row: Record<string, any>): Registration {
  return {
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    userName: row.user_name,
    createdAt: row.created_at,
  };
}

function rowToRating(row: Record<string, any>): Rating {
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

function execQuery<T>(
  sql: string,
  params: any[] = [],
  rowMapper: (row: Record<string, any>) => T
): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const results = dbInstance.exec(sql, params);
  if (results.length === 0) return [];
  const columns = results[0].columns;
  return results[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx];
    });
    return rowMapper(obj);
  });
}

function execGet<T>(
  sql: string,
  params: any[] = [],
  rowMapper: (row: Record<string, any>) => T
): T | undefined {
  const results = execQuery(sql, params, rowMapper);
  return results.length > 0 ? results[0] : undefined;
}

function execRun(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDatabase();
}

async function initDatabase(): Promise<void> {
  if (dbInstance) return;
  dbInstance = await loadDatabase();

  dbInstance.exec(`
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

  saveDatabase();

  const defaultUser = getUserById('user-001');
  if (!defaultUser) {
    execRun(
      'INSERT INTO users (id, name, avatar) VALUES (?, ?, ?)',
      ['user-001', '测试用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user001']
    );
  }
}

function ensureDb(): void {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
}

export { initDatabase };

export function getUserById(id: string): User | undefined {
  ensureDb();
  return execGet('SELECT * FROM users WHERE id = ?', [id], rowToUser);
}

export function getCurrentUser(): User {
  ensureDb();
  const user = getUserById('user-001');
  if (!user) {
    throw new Error('默认用户不存在');
  }
  return user;
}

export function getGroups(page: number = 1, pageSize: number = 20): PaginatedResult<Group> {
  ensureDb();
  const offset = (page - 1) * pageSize;
  const items = execQuery(
    'SELECT * FROM groups ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [pageSize, offset],
    rowToGroup
  );
  const countRow = execGet<{ count: number }>(
    'SELECT COUNT(*) as count FROM groups',
    [],
    (r) => ({ count: r.count })
  );
  const total = countRow?.count || 0;
  return { items, total, page, pageSize };
}

export function getGroupById(id: string): Group | undefined {
  ensureDb();
  return execGet('SELECT * FROM groups WHERE id = ?', [id], rowToGroup);
}

export function createGroup(params: {
  name: string;
  description: string;
  coverImage: string;
  leaderId: string;
  leaderName: string;
}): Group {
  ensureDb();
  const id = uuidv4();
  const createdAt = Date.now();
  execRun(
    'INSERT INTO groups (id, name, description, cover_image, leader_id, leader_name, member_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
    [
      id,
      params.name,
      params.description,
      params.coverImage,
      params.leaderId,
      params.leaderName,
      createdAt,
    ]
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
  ensureDb();
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
    execRun(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  const updated = getGroupById(id);
  if (!updated) {
    throw new Error('更新小组失败');
  }
  return updated;
}

export function deleteGroup(id: string): void {
  ensureDb();
  const existing = getGroupById(id);
  if (!existing) {
    throw new Error('小组不存在');
  }

  const activityIds = execQuery<{ id: string }>(
    'SELECT id FROM activities WHERE group_id = ?',
    [id],
    (r) => ({ id: r.id })
  );

  for (const row of activityIds) {
    execRun('DELETE FROM registrations WHERE activity_id = ?', [row.id]);
    execRun('DELETE FROM ratings WHERE activity_id = ?', [row.id]);
  }
  execRun('DELETE FROM activities WHERE group_id = ?', [id]);
  execRun('DELETE FROM groups WHERE id = ?', [id]);
}

export function getActivities(
  groupId: string,
  page: number = 1,
  pageSize: number = 20
): PaginatedResult<Activity> {
  ensureDb();
  const offset = (page - 1) * pageSize;
  const items = execQuery(
    'SELECT * FROM activities WHERE group_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [groupId, pageSize, offset],
    rowToActivity
  );
  const countRow = execGet<{ count: number }>(
    'SELECT COUNT(*) as count FROM activities WHERE group_id = ?',
    [groupId],
    (r) => ({ count: r.count })
  );
  const total = countRow?.count || 0;
  return { items, total, page, pageSize };
}

export function getActivityById(id: string): Activity | undefined {
  ensureDb();
  return execGet('SELECT * FROM activities WHERE id = ?', [id], rowToActivity);
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
  ensureDb();
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

  execRun(
    'INSERT INTO activities (id, group_id, title, description, start_time, end_time, location, max_participants, current_participants, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
    [
      id,
      params.groupId,
      params.title,
      params.description,
      params.startTime,
      params.endTime,
      params.location,
      params.maxParticipants,
      status,
      createdAt,
    ]
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
  ensureDb();
  const activity = getActivityById(activityId);
  if (!activity) {
    throw new Error('活动不存在');
  }

  if (activity.currentParticipants >= activity.maxParticipants) {
    throw new Error('活动名额已满');
  }

  const existing = execGet(
    'SELECT * FROM registrations WHERE activity_id = ? AND user_id = ?',
    [activityId, userId],
    rowToRegistration
  );
  if (existing) {
    throw new Error('您已报名该活动');
  }

  const id = uuidv4();
  const createdAt = Date.now();
  execRun(
    'INSERT INTO registrations (id, activity_id, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, activityId, userId, userName, createdAt]
  );
  execRun(
    'UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?',
    [activityId]
  );

  const row = execGet(
    'SELECT * FROM registrations WHERE id = ?',
    [id],
    rowToRegistration
  );
  if (!row) {
    throw new Error('报名失败');
  }
  return row;
}

export function unregisterActivity(activityId: string, userId: string): void {
  ensureDb();
  const existing = execGet(
    'SELECT * FROM registrations WHERE activity_id = ? AND user_id = ?',
    [activityId, userId],
    rowToRegistration
  );
  if (!existing) {
    throw new Error('您未报名该活动');
  }
  execRun(
    'DELETE FROM registrations WHERE activity_id = ? AND user_id = ?',
    [activityId, userId]
  );
  execRun(
    'UPDATE activities SET current_participants = current_participants - 1 WHERE id = ?',
    [activityId]
  );
}

export function isRegistered(activityId: string, userId: string): boolean {
  ensureDb();
  const row = execGet<{ count: number }>(
    'SELECT COUNT(*) as count FROM registrations WHERE activity_id = ? AND user_id = ?',
    [activityId, userId],
    (r) => ({ count: r.count })
  );
  return (row?.count || 0) > 0;
}

export function getRatings(activityId: string): Rating[] {
  ensureDb();
  return execQuery(
    'SELECT * FROM ratings WHERE activity_id = ? ORDER BY created_at DESC',
    [activityId],
    rowToRating
  );
}

export function createRating(params: {
  activityId: string;
  userId: string;
  userName: string;
  score: number;
  comment: string;
}): Rating {
  ensureDb();
  if (params.score < 1 || params.score > 5) {
    throw new Error('评分必须在1-5之间');
  }

  const activity = getActivityById(params.activityId);
  if (!activity) {
    throw new Error('活动不存在');
  }

  const existing = execGet(
    'SELECT * FROM ratings WHERE activity_id = ? AND user_id = ?',
    [params.activityId, params.userId],
    rowToRating
  );
  if (existing) {
    throw new Error('您已对该活动进行过评分');
  }

  const id = uuidv4();
  const createdAt = Date.now();
  execRun(
    'INSERT INTO ratings (id, activity_id, user_id, user_name, score, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      params.activityId,
      params.userId,
      params.userName,
      params.score,
      params.comment,
      createdAt,
    ]
  );

  const rating = execGet(
    'SELECT * FROM ratings WHERE id = ?',
    [id],
    rowToRating
  );
  if (!rating) {
    throw new Error('创建评分失败');
  }
  return rating;
}

export function getGroupsByUserId(userId: string): Group[] {
  ensureDb();
  return execQuery(
    'SELECT * FROM groups WHERE leader_id = ? ORDER BY created_at DESC',
    [userId],
    rowToGroup
  );
}

export function getActivitiesByUserId(userId: string): Activity[] {
  ensureDb();
  return execQuery(
    `SELECT a.* FROM activities a
     INNER JOIN registrations r ON a.id = r.activity_id
     WHERE r.user_id = ?
     ORDER BY a.created_at DESC`,
    [userId],
    rowToActivity
  );
}

export function getRatingsByUserId(userId: string): Rating[] {
  ensureDb();
  return execQuery(
    'SELECT * FROM ratings WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    rowToRating
  );
}

export function hasActivities(groupId: string): boolean {
  ensureDb();
  const row = execGet<{ count: number }>(
    'SELECT COUNT(*) as count FROM activities WHERE group_id = ?',
    [groupId],
    (r) => ({ count: r.count })
  );
  return (row?.count || 0) > 0;
}

export default dbInstance;
