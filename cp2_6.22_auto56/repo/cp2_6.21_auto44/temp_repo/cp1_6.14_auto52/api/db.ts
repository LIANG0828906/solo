import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbFile = path.join(dbDir, 'db.json');

interface DataSchema {
  users: any[];
  ideas: any[];
  tasks: any[];
  currentUserId: string;
}

const defaultData: DataSchema = {
  users: [],
  ideas: [],
  tasks: [],
  currentUserId: '',
};

const adapter = new JSONFile<DataSchema>(dbFile);
export const db = new Low<DataSchema>(adapter, defaultData);

export async function initDb() {
  await db.read();
  if (!db.data || !db.data.users || db.data.users.length === 0) {
    const { seedData } = await import('./seed.js');
    seedData();
  }
}
