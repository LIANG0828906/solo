import { MindMapNode } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';

const LEVEL_COLORS: Record<number, string> = {
  0: '#ffffff',
  1: '#4A90D9',
  2: '#7B61FF',
  3: '#50C878',
};

function getColorForLevel(level: number): string {
  if (level === 0) return '#ffffff';
  return LEVEL_COLORS[level] || LEVEL_COLORS[3];
}

function generateId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 12);
}

export function parseTextToMindMap(text: string): MindMapNode {
  const lines = text.split(/[\n;；]/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    const root: MindMapNode = {
      id: generateId(),
      text: '思维导图',
      children: [],
      x: 0,
      y: 0,
      color: getColorForLevel(0),
      parentId: null,
      level: 0,
    };
    return root;
  }

  const rootText = lines[0].split(/[：:]/)[0] || '思维导图';
  const root: MindMapNode = {
    id: generateId(),
    text: rootText,
    children: [],
    x: 0,
    y: 0,
    color: getColorForLevel(0),
    parentId: null,
    level: 0,
  };

  const rootDescMatch = lines[0].match(/[：:](.+)/);
  const rootItems = rootDescMatch
    ? rootDescMatch[1].split(/[、,，、/]/).map((s) => s.trim()).filter((s) => s.length > 0)
    : [];

  const allItems: string[] = [...rootItems];
  for (let i = 1; i < lines.length; i++) {
    allItems.push(lines[i]);
  }

  const level1Nodes: MindMapNode[] = [];
  const verticalSpacing = 80;

  allItems.forEach((item, index) => {
    const subItems = item.split(/[、,，、/]/).map((s) => s.trim()).filter((s) => s.length > 0);

    if (subItems.length <= 1) {
      const node: MindMapNode = {
        id: generateId(),
        text: item,
        children: [],
        x: 250,
        y: (index - (allItems.length - 1) / 2) * verticalSpacing,
        color: getColorForLevel(1),
        parentId: root.id,
        level: 1,
      };
      level1Nodes.push(node);
    } else {
      const mainText = subItems[0];
      const node: MindMapNode = {
        id: generateId(),
        text: mainText,
        children: [],
        x: 250,
        y: (index - (allItems.length - 1) / 2) * verticalSpacing,
        color: getColorForLevel(1),
        parentId: root.id,
        level: 1,
      };

      const subSpacing = 60;
      for (let j = 1; j < subItems.length; j++) {
        const childNode: MindMapNode = {
          id: generateId(),
          text: subItems[j],
          children: [],
          x: 480,
          y: node.y + (j - (subItems.length - 1) / 2) * subSpacing,
          color: getColorForLevel(2),
          parentId: node.id,
          level: 2,
        };
        node.children.push(childNode);
      }

      level1Nodes.push(node);
    }
  });

  root.children = level1Nodes;
  return root;
}

let db: Database.Database;

export function initDatabase(dbPath?: string): void {
  const databasePath = dbPath || path.join(process.cwd(), 'mindmaps.db');
  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS mindmaps (
      room_code TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function saveMindMap(roomCode: string, data: MindMapNode): void {
  const jsonData = JSON.stringify(data);
  const stmt = db.prepare(`
    INSERT INTO mindmaps (room_code, data, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(room_code) DO UPDATE SET
      data = excluded.data,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(roomCode, jsonData);
}

export function loadMindMap(roomCode: string): MindMapNode | null {
  const stmt = db.prepare('SELECT data FROM mindmaps WHERE room_code = ?');
  const row = stmt.get(roomCode) as { data: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.data) as MindMapNode;
  } catch {
    return null;
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
