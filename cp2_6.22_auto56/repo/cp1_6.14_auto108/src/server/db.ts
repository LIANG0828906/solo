import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DatabaseSchema } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultData: DatabaseSchema = {
  users: [],
  works: [],
  invitations: [],
  inspirations: [],
  comments: [],
};

const file = join(__dirname, '../../db.json');
const adapter = new JSONFile<DatabaseSchema>(file);
export const db = new Low<DatabaseSchema>(adapter, defaultData);

export async function initDB() {
  await db.read();
  if (!db.data) {
    db.data = defaultData;
  }
  if (!db.data.users) db.data.users = [];
  if (!db.data.works) db.data.works = [];
  if (!db.data.invitations) db.data.invitations = [];
  if (!db.data.inspirations) db.data.inspirations = [];
  if (!db.data.comments) db.data.comments = [];
  await db.write();
}
