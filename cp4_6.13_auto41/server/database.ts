import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'whiteboard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS strokes (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    color TEXT NOT NULL,
    width INTEGER NOT NULL,
    points TEXT NOT NULL,
    z_index INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
  );

  CREATE TABLE IF NOT EXISTS stickies (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL DEFAULT 180,
    height REAL NOT NULL DEFAULT 120,
    text TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#FFF9C4',
    z_index INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    parent_id TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    radius REAL NOT NULL DEFAULT 40,
    text TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#1E3A5F',
    z_index INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (parent_id) REFERENCES nodes(id)
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_color TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
  );

  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    snapshot TEXT NOT NULL,
    thumbnail TEXT,
    timestamp INTEGER NOT NULL,
    label TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
  );

  CREATE INDEX IF NOT EXISTS idx_strokes_room ON strokes(room_id);
  CREATE INDEX IF NOT EXISTS idx_stickies_room ON stickies(room_id);
  CREATE INDEX IF NOT EXISTS idx_nodes_room ON nodes(room_id);
  CREATE INDEX IF NOT EXISTS idx_chats_room ON chats(room_id);
  CREATE INDEX IF NOT EXISTS idx_versions_room ON versions(room_id);
`);

export interface Stroke {
  id: string;
  room_id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  z_index: number;
  created_at: number;
}

export interface Sticky {
  id: string;
  room_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  z_index: number;
  created_at: number;
}

export interface MindNode {
  id: string;
  room_id: string;
  parent_id: string | null;
  x: number;
  y: number;
  radius: number;
  text: string;
  color: string;
  z_index: number;
  created_at: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_color: string;
  message: string;
  timestamp: number;
}

export interface Version {
  id: string;
  room_id: string;
  snapshot: string;
  thumbnail: string | null;
  timestamp: number;
  label: string | null;
}

export interface BoardSnapshot {
  strokes: Stroke[];
  stickies: Sticky[];
  nodes: MindNode[];
}

export function ensureRoom(roomId: string): void {
  const now = Date.now();
  const room = db.prepare('SELECT room_id FROM rooms WHERE room_id = ?').get(roomId);
  if (!room) {
    db.prepare('INSERT INTO rooms (room_id, created_at, last_active) VALUES (?, ?, ?)').run(roomId, now, now);
  } else {
    db.prepare('UPDATE rooms SET last_active = ? WHERE room_id = ?').run(now, roomId);
  }
}

export function getBoardState(roomId: string): BoardSnapshot {
  const strokes = db.prepare('SELECT * FROM strokes WHERE room_id = ? ORDER BY z_index, created_at').all(roomId) as Stroke[];
  const stickies = db.prepare('SELECT * FROM stickies WHERE room_id = ? ORDER BY z_index, created_at').all(roomId) as Sticky[];
  const nodes = db.prepare('SELECT * FROM nodes WHERE room_id = ? ORDER BY z_index, created_at').all(roomId) as MindNode[];
  
  return {
    strokes: strokes.map(s => ({ ...s, points: JSON.parse(s.points as unknown as string) })),
    stickies,
    nodes,
  };
}

export function addStroke(stroke: Omit<Stroke, 'created_at'>): Stroke {
  const now = Date.now();
  const id = stroke.id || uuidv4();
  db.prepare(`
    INSERT INTO strokes (id, room_id, color, width, points, z_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, stroke.room_id, stroke.color, stroke.width, JSON.stringify(stroke.points), stroke.z_index, now);
  return { ...stroke, id, created_at: now };
}

export function deleteStroke(id: string, roomId: string): void {
  db.prepare('DELETE FROM strokes WHERE id = ? AND room_id = ?').run(id, roomId);
}

export function addSticky(sticky: Omit<Sticky, 'created_at'>): Sticky {
  const now = Date.now();
  const id = sticky.id || uuidv4();
  db.prepare(`
    INSERT INTO stickies (id, room_id, x, y, width, height, text, color, z_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sticky.room_id, sticky.x, sticky.y, sticky.width, sticky.height, sticky.text, sticky.color, sticky.z_index, now);
  return { ...sticky, id, created_at: now };
}

export function updateSticky(id: string, roomId: string, updates: Partial<Sticky>): void {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'room_id');
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);
  values.push(id, roomId);
  db.prepare(`UPDATE stickies SET ${setClause} WHERE id = ? AND room_id = ?`).run(...values);
}

export function deleteSticky(id: string, roomId: string): void {
  db.prepare('DELETE FROM stickies WHERE id = ? AND room_id = ?').run(id, roomId);
}

export function addNode(node: Omit<MindNode, 'created_at'>): MindNode {
  const now = Date.now();
  const id = node.id || uuidv4();
  db.prepare(`
    INSERT INTO nodes (id, room_id, parent_id, x, y, radius, text, color, z_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, node.room_id, node.parent_id, node.x, node.y, node.radius, node.text, node.color, node.z_index, now);
  return { ...node, id, created_at: now };
}

export function updateNode(id: string, roomId: string, updates: Partial<MindNode>): void {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'room_id');
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);
  values.push(id, roomId);
  db.prepare(`UPDATE nodes SET ${setClause} WHERE id = ? AND room_id = ?`).run(...values);
}

export function deleteNode(id: string, roomId: string): void {
  const stmt = db.prepare('SELECT id FROM nodes WHERE parent_id = ? AND room_id = ?');
  const children = stmt.all(id, roomId) as { id: string }[];
  for (const child of children) {
    deleteNode(child.id, roomId);
  }
  db.prepare('DELETE FROM nodes WHERE id = ? AND room_id = ?').run(id, roomId);
}

export function addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const now = Date.now();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO chats (id, room_id, user_id, username, avatar_color, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, msg.room_id, msg.user_id, msg.username, msg.avatar_color, msg.message, now);
  return { ...msg, id, timestamp: now };
}

export function getRecentChats(roomId: string, limit: number = 50): ChatMessage[] {
  return db.prepare(
    'SELECT * FROM chats WHERE room_id = ? ORDER BY timestamp DESC LIMIT ?'
  ).all(roomId, limit).reverse() as ChatMessage[];
}

export function saveVersion(roomId: string, snapshot: BoardSnapshot, thumbnail?: string, label?: string): Version {
  const now = Date.now();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO versions (id, room_id, snapshot, thumbnail, timestamp, label)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, roomId, JSON.stringify(snapshot), thumbnail || null, now, label || null);
  return { id, room_id: roomId, snapshot: JSON.stringify(snapshot), thumbnail: thumbnail || null, timestamp: now, label: label || null };
}

export function getVersions(roomId: string): Version[] {
  return db.prepare(
    'SELECT id, room_id, thumbnail, timestamp, label FROM versions WHERE room_id = ? ORDER BY timestamp DESC'
  ).all(roomId) as Version[];
}

export function getVersion(id: string, roomId: string): Version | null {
  const version = db.prepare(
    'SELECT * FROM versions WHERE id = ? AND room_id = ?'
  ).get(id, roomId) as Version | undefined;
  return version || null;
}

export function restoreVersion(roomId: string, versionId: string): BoardSnapshot | null {
  const version = getVersion(versionId, roomId);
  if (!version) return null;
  
  const snapshot = JSON.parse(version.snapshot) as BoardSnapshot;
  
  db.prepare('DELETE FROM strokes WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM stickies WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM nodes WHERE room_id = ?').run(roomId);
  
  for (const stroke of snapshot.strokes) {
    addStroke(stroke);
  }
  for (const sticky of snapshot.stickies) {
    addSticky(sticky);
  }
  for (const node of snapshot.nodes) {
    addNode(node);
  }
  
  return snapshot;
}

export function getMaxZIndex(roomId: string): number {
  const row = db.prepare(`
    SELECT MAX(z) as max_z FROM (
      SELECT MAX(z_index) as z FROM strokes WHERE room_id = ?
      UNION ALL SELECT MAX(z_index) FROM stickies WHERE room_id = ?
      UNION ALL SELECT MAX(z_index) FROM nodes WHERE room_id = ?
    )
  `).get(roomId, roomId, roomId) as { max_z: number | null };
  return row.max_z || 0;
}

export default db;
