import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { ProjectLog, Material } from '@/types';

interface CraftStudioDB extends DBSchema {
  projects: {
    key: string;
    value: ProjectLog;
  };
  materials: {
    key: string;
    value: Material;
  };
}

let dbPromise: Promise<IDBPDatabase<CraftStudioDB>> | null = null;

function getDB(): Promise<IDBPDatabase<CraftStudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CraftStudioDB>('craft-studio-v2', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('materials')) {
          db.createObjectStore('materials', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

export const db = {
  async getAllProjects(): Promise<ProjectLog[]> {
    const database = await getDB();
    return database.getAll('projects');
  },

  async saveProject(project: ProjectLog): Promise<void> {
    const database = await getDB();
    await database.put('projects', project);
  },

  async deleteProject(id: string): Promise<void> {
    const database = await getDB();
    await database.delete('projects', id);
  },

  async getAllMaterials(): Promise<Material[]> {
    const database = await getDB();
    return database.getAll('materials');
  },

  async saveMaterial(material: Material): Promise<void> {
    const database = await getDB();
    await database.put('materials', material);
  },

  async deleteMaterial(id: string): Promise<void> {
    const database = await getDB();
    await database.delete('materials', id);
  }
};
