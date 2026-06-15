import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Customer, Receipt } from '../../shared/types/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseSchema {
  customers: Customer[];
  receipts: Receipt[];
  receiptCounter: Record<string, number>;
}

const defaultData: DatabaseSchema = {
  customers: [],
  receipts: [],
  receiptCounter: {},
};

const dbPath = path.join(__dirname, 'db.json');
const adapter = new JSONFile<DatabaseSchema>(dbPath);
const db = new Low<DatabaseSchema>(adapter, defaultData);

async function initDb(): Promise<Low<DatabaseSchema>> {
  await db.read();

  if (db.data === null || db.data === undefined) {
    db.data = defaultData;
    await db.write();
  }

  if (!db.data.customers) {
    db.data.customers = [];
  }
  if (!db.data.receipts) {
    db.data.receipts = [];
  }
  if (!db.data.receiptCounter) {
    db.data.receiptCounter = {};
  }

  return db;
}

await initDb();

export { db, initDb };
export default db;
