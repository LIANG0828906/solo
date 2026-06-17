import { openDB, IDBPDatabase } from 'idb';
import type { Palette, VersionSnapshot } from '../types';

const DB_NAME = 'palettesync_db';
const DB_VERSION = 1;
const PALETTE_STORE = 'palettes';
const VERSION_STORE = 'versions';
const MAX_VERSIONS = 5;

let db: IDBPDatabase | null = null;

export async function initDB(): Promise<void> {
  if (db) return;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PALETTE_STORE)) {
        const paletteStore = db.createObjectStore(PALETTE_STORE, { keyPath: 'id' });
        paletteStore.createIndex('createdAt', 'createdAt');
        paletteStore.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains(VERSION_STORE)) {
        const versionStore = db.createObjectStore(VERSION_STORE, { keyPath: 'id' });
        versionStore.createIndex('paletteId', 'paletteId');
        versionStore.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export async function savePalette(palette: Palette): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  palette.updatedAt = new Date().toISOString();
  await db!.put(PALETTE_STORE, palette);
}

export async function loadPalettes(): Promise<Palette[]> {
  if (!db) throw new Error('Database not initialized');
  const palettes = await db!.getAllFromIndex(PALETTE_STORE, 'updatedAt');
  return palettes.reverse();
}

export async function deletePalette(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db!.delete(PALETTE_STORE, id);
  const versions = await loadVersions(id);
  for (const version of versions) {
    await db!.delete(VERSION_STORE, version.id);
  }
}

export async function saveVersion(version: VersionSnapshot): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db!.put(VERSION_STORE, version);

  const versions = await loadVersions(version.paletteId);
  if (versions.length > MAX_VERSIONS) {
    const sorted = versions.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const toDelete = sorted.slice(0, sorted.length - MAX_VERSIONS);
    for (const v of toDelete) {
      await db!.delete(VERSION_STORE, v.id);
    }
  }
}

export async function loadVersions(paletteId: string): Promise<VersionSnapshot[]> {
  if (!db) throw new Error('Database not initialized');
  const allVersions = await db!.getAllFromIndex(VERSION_STORE, 'paletteId', paletteId);
  return allVersions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getPalette(id: string): Promise<Palette | undefined> {
  if (!db) throw new Error('Database not initialized');
  return db!.get(PALETTE_STORE, id);
}

export async function getVersion(id: string): Promise<VersionSnapshot | undefined> {
  if (!db) throw new Error('Database not initialized');
  return db!.get(VERSION_STORE, id);
}
