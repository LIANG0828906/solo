import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BoxSeries, User, Auction, Transaction, Notification } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

interface Database {
  series: BoxSeries[];
  users: User[];
  auctions: Auction[];
  transactions: Transaction[];
  notifications: Notification[];
}

const DB_PATH = path.join(DATA_DIR, 'db.json');

async function ensureDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readDB(): Promise<Database> {
  await ensureDir();
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw) as Database;
  } catch {
    return {
      series: [],
      users: [],
      auctions: [],
      transactions: [],
      notifications: []
    };
  }
}

export async function writeDB(db: Database): Promise<void> {
  await ensureDir();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getSeries(): Promise<BoxSeries[]> {
  const db = await readDB();
  return db.series;
}

export async function getSeriesById(id: string): Promise<BoxSeries | undefined> {
  const db = await readDB();
  return db.series.find(s => s.id === id);
}

export async function updateSeries(series: BoxSeries): Promise<void> {
  const db = await readDB();
  const idx = db.series.findIndex(s => s.id === series.id);
  if (idx >= 0) db.series[idx] = series;
  else db.series.push(series);
  await writeDB(db);
}

export async function getUsers(): Promise<User[]> {
  const db = await readDB();
  return db.users;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await readDB();
  return db.users.find(u => u.id === id);
}

export async function updateUser(user: User): Promise<void> {
  const db = await readDB();
  const idx = db.users.findIndex(u => u.id === user.id);
  if (idx >= 0) db.users[idx] = user;
  else db.users.push(user);
  await writeDB(db);
}

export async function getAuctions(): Promise<Auction[]> {
  const db = await readDB();
  return db.auctions;
}

export async function getAuctionById(id: string): Promise<Auction | undefined> {
  const db = await readDB();
  return db.auctions.find(a => a.id === id);
}

export async function updateAuction(auction: Auction): Promise<void> {
  const db = await readDB();
  const idx = db.auctions.findIndex(a => a.id === auction.id);
  if (idx >= 0) db.auctions[idx] = auction;
  else db.auctions.push(auction);
  await writeDB(db);
}

export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  const db = await readDB();
  return db.transactions.filter(t => t.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await readDB();
  db.transactions.push(tx);
  await writeDB(db);
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const db = await readDB();
  return db.notifications.filter(n => n.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
}

export async function addNotification(n: Notification): Promise<void> {
  const db = await readDB();
  db.notifications.push(n);
  await writeDB(db);
}

export async function markNotificationRead(id: string): Promise<void> {
  const db = await readDB();
  const n = db.notifications.find(x => x.id === id);
  if (n) {
    n.read = true;
    await writeDB(db);
  }
}

export async function getAllArtworks() {
  const db = await readDB();
  const artworks = [];
  for (const s of db.series) {
    for (const a of s.artworks) {
      artworks.push({ ...a, seriesName: s.name });
    }
  }
  return artworks;
}

export async function getArtworkById(id: string) {
  const artworks = await getAllArtworks();
  return artworks.find(a => a.id === id);
}
