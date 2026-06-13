import Database from 'better-sqlite3';
import path from 'path';

export interface Component {
  id: string;
  type: string;
  order_index: number;
  content: string;
  style: string;
  width: string;
}

export interface ComponentContent {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  features?: string[];
  author?: string;
  avatar?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface ComponentStyle {
  backgroundColor?: string;
  fontSize?: string;
  textColor?: string;
}

const dbPath = path.join(process.cwd(), 'components.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL DEFAULT '{}',
    style TEXT NOT NULL DEFAULT '{}',
    width TEXT NOT NULL DEFAULT '100%'
  )
`);

export function getAllComponents(): Component[] {
  const rows = db.prepare('SELECT * FROM components ORDER BY order_index ASC').all() as Component[];
  return rows;
}

export function getComponentById(id: string): Component | undefined {
  const row = db.prepare('SELECT * FROM components WHERE id = ?').get(id) as Component | undefined;
  return row;
}

export function createComponent(
  id: string,
  type: string,
  order_index: number,
  content: string = '{}',
  style: string = '{}',
  width: string = '100%'
): Component {
  db.prepare(
    'INSERT INTO components (id, type, order_index, content, style, width) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, type, order_index, content, style, width);
  return { id, type, order_index, content, style, width };
}

export function updateComponent(
  id: string,
  updates: Partial<Omit<Component, 'id'>>
): Component | undefined {
  const existing = getComponentById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.order_index !== undefined) {
    fields.push('order_index = ?');
    values.push(updates.order_index);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.style !== undefined) {
    fields.push('style = ?');
    values.push(updates.style);
  }
  if (updates.width !== undefined) {
    fields.push('width = ?');
    values.push(updates.width);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE components SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return getComponentById(id);
}

export function deleteComponent(id: string): boolean {
  const result = db.prepare('DELETE FROM components WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getMaxOrderIndex(): number {
  const row = db.prepare('SELECT MAX(order_index) as max FROM components').get() as { max: number | null };
  return row.max ?? -1;
}
