/**
 * 数据库初始化和管理模块
 * 使用 lowdb (ESM 版本) 管理 JSON 文件数据库
 * 提供 getDb() 函数返回 Low 实例供全局使用
 * 被 api/routes/auth.ts, api/routes/matches.ts, api/utils/matching.ts 引用
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { DatabaseSchema, User } from '../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const defaultData: DatabaseSchema = {
  users: [],
  matches: [],
  history: [],
};

const adapter = new JSONFile<DatabaseSchema>(dbFilePath);
const db = new Low<DatabaseSchema>(adapter, defaultData);

let initialized = false;

async function initDb() {
  if (initialized) return;
  await db.read();

  if (db.data.users.length === 0) {
    const seedUsers: User[] = [
      {
        id: uuidv4(),
        nickname: '篮球小将',
        position: '后卫',
        level: '进阶',
        password: '123456',
      },
      {
        id: uuidv4(),
        nickname: '内线霸主',
        position: '中锋',
        level: '高手',
        password: '123456',
      },
      {
        id: uuidv4(),
        nickname: '闪电前锋',
        position: '前锋',
        level: '新人',
        password: '123456',
      },
      {
        id: uuidv4(),
        nickname: '三分神射手',
        position: '后卫',
        level: '高手',
        password: '123456',
      },
    ];
    db.data.users = seedUsers;
    await db.write();
  }

  initialized = true;
}

export async function getDb() {
  await initDb();
  return db;
}
