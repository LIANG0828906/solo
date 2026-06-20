import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import type { User, Resource, Version, Annotation, Project, ResourceProject } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseSchema {
  users: User[];
  resources: Resource[];
  versions: Version[];
  annotations: Annotation[];
  projects: Project[];
  resourceProjects: ResourceProject[];
}

const defaultData: DatabaseSchema = {
  users: [],
  resources: [],
  versions: [],
  annotations: [],
  projects: [
    { id: 'proj-1', name: '暗影传说', color: '#10B981' },
    { id: 'proj-2', name: '星际漂流', color: '#6366F1' },
    { id: 'proj-3', name: '像素冒险', color: '#F59E0B' },
    { id: 'proj-4', name: '末日生存', color: '#EF4444' },
  ],
  resourceProjects: [],
};

let dbInstance: Low<DatabaseSchema> | null = null;

export async function getDb(): Promise<Low<DatabaseSchema>> {
  if (dbInstance) return dbInstance;

  const dbDir = path.join(__dirname, '..', 'data');
  const file = new JSONFile<DatabaseSchema>(path.join(dbDir, 'db.json'));
  const db = new Low(file, defaultData);
  await db.read();
  await db.write();
  dbInstance = db;
  return db;
}
