import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

export interface JsonRepository<T> {
  read: () => Promise<T[]>;
  write: (data: T[]) => Promise<void>;
  findById: (id: string) => Promise<T | undefined>;
  add: (item: T) => Promise<T>;
  update: (id: string, item: Partial<T>) => Promise<T | undefined>;
  remove: (id: string) => Promise<boolean>;
}

export function createJsonRepository<T extends { id: string }>(
  fileName: string
): JsonRepository<T> {
  const filePath = path.join(DATA_DIR, fileName);

  const read = async (): Promise<T[]> => {
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const write = async (data: T[]): Promise<void> => {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  };

  const findById = async (id: string): Promise<T | undefined> => {
    const items = await read();
    return items.find(item => item.id === id);
  };

  const add = async (item: T): Promise<T> => {
    const items = await read();
    items.push(item);
    await write(items);
    return item;
  };

  const update = async (id: string, item: Partial<T>): Promise<T | undefined> => {
    const items = await read();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...item } as T;
    await write(items);
    return items[index];
  };

  const remove = async (id: string): Promise<boolean> => {
    const items = await read();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    await write(filtered);
    return true;
  };

  return { read, write, findById, add, update, remove };
}
