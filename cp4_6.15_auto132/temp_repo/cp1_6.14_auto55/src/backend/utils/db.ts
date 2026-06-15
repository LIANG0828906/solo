import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Route, Challenge, Comment, User } from '../../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DBSchema {
  routes: Route[];
  challenges: Challenge[];
  comments: Comment[];
  users: User[];
}

const defaultData: DBSchema = {
  routes: [],
  challenges: [],
  comments: [],
  users: [],
};

const dbPath = path.join(__dirname, '../../../../db.json');

let db: Low<DBSchema> | null = null;

export async function getDB(): Promise<Low<DBSchema>> {
  if (!db) {
    const adapter = new JSONFile<DBSchema>(dbPath);
    db = new Low(adapter, defaultData);
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    db.data.routes = db.data.routes || [];
    db.data.challenges = db.data.challenges || [];
    db.data.comments = db.data.comments || [];
    db.data.users = db.data.users || [];
  }
  return db;
}
