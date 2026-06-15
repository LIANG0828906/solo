import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Database,
  User,
  Item,
  Comment,
  ExchangeRequest,
  Notification,
  UploadRecord,
  Difficulty,
  Step,
} from '../shared/types.js';

const DB_PATH = path.join(process.cwd(), 'db.json');

let db: Database;

function readDb(): Database {
  if (!fs.existsSync(DB_PATH)) {
    return {
      users: [],
      items: [],
      exchangeRequests: [],
      notifications: [],
      uploads: [],
    };
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw) as Database;
}

function writeDb(): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function initDb(): void {
  db = readDb();
}

export function createUser(username: string): User {
  const user: User = {
    id: uuidv4(),
    username,
  };
  db.users.push(user);
  writeDb();
  return user;
}

export function getUserByUsername(username: string): User | undefined {
  return db.users.find((u) => u.username === username);
}

export function getUserById(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function createItem(data: {
  userId: string;
  username: string;
  name: string;
  difficulty: Difficulty;
  tools: string[];
  steps: Step[];
  experience: string;
  beforeImages: { id: string