import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { Script, Version } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Data {
  scripts: Script[];
  versions: Version[];
}

const defaultData: Data = {
  scripts: [
    {
      id: 'script-1',
      title: '示例剧本：星球探险',
      content: `第一幕：启程\n\n在一个遥远的星系，宇航员小明踏上了探索未知星球的旅程。\n\n第二幕：发现\n\n小明在陌生星球上发现了神秘的古老遗迹。\n\n第三幕：归途\n\n带着外星文明的智慧，小明踏上了归途。`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  versions: [
    {
      id: 'version-1',
      scriptId: 'script-1',
      versionNumber: 1,
      content: `第一幕：启程\n\n在一个遥远的星系，宇航员小明踏上了探索未知星球的旅程。\n\n第二幕：发现\n\n小明在陌生星球上发现了神秘的古老遗迹。\n\n第三幕：归途\n\n带着外星文明的智慧，小明踏上了归途。`,
      author: '系统',
      createdAt: new Date().toISOString(),
    },
  ],
};

const file = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFile<Data>(file);
const db = new Low<Data>(adapter, defaultData);

await db.read();
await db.write();

export const dbInstance = db;

export const scriptOperations = {
  async getAll(): Promise<Script[]> {
    await db.read();
    return db.data.scripts;
  },

  async getById(id: string): Promise<Script | undefined> {
    await db.read();
    return db.data.scripts.find((s) => s.id === id);
  },

  async create(data: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>): Promise<Script> {
    await db.read();
    const newScript: Script = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.data.scripts.push(newScript);
    await db.write();
    return newScript;
  },

  async update(id: string, data: Partial<Omit<Script, 'id' | 'createdAt'>>): Promise<Script | undefined> {
    await db.read();
    const index = db.data.scripts.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    db.data.scripts[index] = {
      ...db.data.scripts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await db.write();
    return db.data.scripts[index];
  },

  async delete(id: string): Promise<boolean> {
    await db.read();
    const index = db.data.scripts.findIndex((s) => s.id === id);
    if (index === -1) return false;
    db.data.scripts.splice(index, 1);
    db.data.versions = db.data.versions.filter((v) => v.scriptId !== id);
    await db.write();
    return true;
  },
};

export const versionOperations = {
  async getByScriptId(scriptId: string): Promise<Version[]> {
    await db.read();
    return db.data.versions
      .filter((v) => v.scriptId === scriptId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  },

  async getById(scriptId: string, versionId: string): Promise<Version | undefined> {
    await db.read();
    return db.data.versions.find((v) => v.scriptId === scriptId && v.id === versionId);
  },

  async create(scriptId: string, data: Omit<Version, 'id' | 'scriptId' | 'versionNumber' | 'createdAt'>): Promise<Version | undefined> {
    await db.read();
    const script = db.data.scripts.find((s) => s.id === scriptId);
    if (!script) return undefined;

    const existingVersions = db.data.versions.filter((v) => v.scriptId === scriptId);
    const nextVersion = existingVersions.length > 0
      ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1
      : 1;

    const newVersion: Version = {
      ...data,
      id: uuidv4(),
      scriptId,
      versionNumber: nextVersion,
      createdAt: new Date().toISOString(),
    };
    db.data.versions.push(newVersion);
    await db.write();
    return newVersion;
  },
};
