import { db } from '../db/init.js';
import { Leather, LeatherDbRow, mapLeather } from '../types/index.js';

function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row: T) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows: T[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function getAllLeathers(): Promise<Leather[]> {
  const rows = await all<LeatherDbRow>('SELECT * FROM leather ORDER BY receive_date DESC');
  return rows.map(mapLeather);
}

export async function getLeatherById(id: number): Promise<Leather | undefined> {
  const row = await get<LeatherDbRow>('SELECT * FROM leather WHERE id = ?', [id]);
  return row ? mapLeather(row) : undefined;
}

export async function createLeather(data: Omit<Leather, 'id'>): Promise<Leather> {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO leather (name, type, thickness, area, remaining, receive_date) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [data.name, data.type, data.thickness, data.area, data.remaining, data.receiveDate];
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        const newId = this.lastID;
        resolve({ id: newId, ...data });
      }
    });
  });
}

export async function updateLeather(id: number, data: Partial<Omit<Leather, 'id'>>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.type !== undefined) {
    fields.push('type = ?');
    params.push(data.type);
  }
  if (data.thickness !== undefined) {
    fields.push('thickness = ?');
    params.push(data.thickness);
  }
  if (data.area !== undefined) {
    fields.push('area = ?');
    params.push(data.area);
  }
  if (data.remaining !== undefined) {
    fields.push('remaining = ?');
    params.push(data.remaining);
  }
  if (data.receiveDate !== undefined) {
    fields.push('receive_date = ?');
    params.push(data.receiveDate);
  }

  if (fields.length === 0) return;

  params.push(id);
  await run(`UPDATE leather SET ${fields.join(', ')} WHERE id = ?`, params);
}

export async function deleteLeather(id: number): Promise<void> {
  await run('DELETE FROM leather WHERE id = ?', [id]);
}
