import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'flea-market.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      total_stalls INTEGER NOT NULL,
      grid_columns INTEGER NOT NULL,
      grid_rows INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stalls (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      stall_number INTEGER NOT NULL,
      grid_x INTEGER NOT NULL,
      grid_y INTEGER NOT NULL,
      owner_name TEXT,
      type TEXT,
      assigned INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      stall_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'on_sale',
      FOREIGN KEY (stall_id) REFERENCES stalls(id)
    );

    CREATE INDEX IF NOT EXISTS idx_stalls_activity_id ON stalls(activity_id);
    CREATE INDEX IF NOT EXISTS idx_items_stall_id ON items(stall_id);
    CREATE INDEX IF NOT EXISTS idx_stalls_type ON stalls(type);
  `);
}

export type StallType = 'food' | 'handmade' | 'secondhand' | 'cultural';
export type ItemStatus = 'on_sale' | 'sold';

export interface ActivityRow {
  id: string;
  name: string;
  date: string;
  total_stalls: number;
  grid_columns: number;
  grid_rows: number;
  created_at: string;
}

export interface StallRow {
  id: string;
  activity_id: string;
  stall_number: number;
  grid_x: number;
  grid_y: number;
  owner_name: string | null;
  type: StallType | null;
  assigned: number;
}

export interface ItemRow {
  id: string;
  stall_id: string;
  name: string;
  price: number;
  status: ItemStatus;
}

export interface Activity {
  id: string;
  name: string;
  date: string;
  totalStalls: number;
  gridColumns: number;
  gridRows: number;
  createdAt: string;
}

export interface Stall {
  id: string;
  activityId: string;
  stallNumber: number;
  gridX: number;
  gridY: number;
  ownerName: string | null;
  type: StallType | null;
  assigned: boolean;
}

export interface Item {
  id: string;
  stallId: string;
  name: string;
  price: number;
  status: ItemStatus;
}

export function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    totalStalls: row.total_stalls,
    gridColumns: row.grid_columns,
    gridRows: row.grid_rows,
    createdAt: row.created_at,
  };
}

export function rowToStall(row: StallRow): Stall {
  return {
    id: row.id,
    activityId: row.activity_id,
    stallNumber: row.stall_number,
    gridX: row.grid_x,
    gridY: row.grid_y,
    ownerName: row.owner_name,
    type: row.type,
    assigned: row.assigned === 1,
  };
}

export function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    stallId: row.stall_id,
    name: row.name,
    price: row.price,
    status: row.status,
  };
}
