import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import type {
  Inspiration,
  Project,
  Task,
  ProgressLog,
  Tag,
  AppData,
} from './types';

const DB_NAME = 'creative-forge-db';
const DB_VERSION = 1;

interface StoreState {
  inspirations: Inspiration[];
  projects: Project[];
  tasks: Task[];
  progressLogs: ProgressLog[];
  tags: Tag[];
  dbReady: boolean;
  db: IDBPDatabase | null;
  initDB: () => Promise<void>;
  loadAll: () => Promise<void>;
  addInspiration: (data: Omit<Inspiration, 'id' | 'createdAt'>) => Promise<Inspiration>;
  updateInspiration: (id: string, data: Partial<Inspiration>) => Promise<void>;
  deleteInspiration: (id: string) => Promise<void>;
  addProject: (data: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (data: Omit<Task, 'id'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addProgressLog: (data: Omit<ProgressLog, 'id' | 'createdAt'>) => Promise<ProgressLog>;
  updateProgressLog: (id: string, data: Partial<ProgressLog>) => Promise<void>;
  deleteProgressLog: (id: string) => Promise<void>;
  addTag: (name: string) => Promise<Tag>;
  getOrCreateTag: (name: string) => Promise<Tag>;
  exportData: () => Promise<Blob>;
  importData: (file: File) => Promise<void>;
  inspirationToProject: (inspirationId: string) => Promise<Project>;
}

const uuid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const initIndexedDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('inspirations')) {
        const store = db.createObjectStore('inspirations', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('category', 'category');
      }
      if (!db.objectStoreNames.contains('projects')) {
        const store = db.createObjectStore('projects', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId');
        store.createIndex('order', 'order');
      }
      if (!db.objectStoreNames.contains('progressLogs')) {
        const store = db.createObjectStore('progressLogs', { keyPath: 'id' });
        store.createIndex('taskId', 'taskId');
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('tags')) {
        db.createObjectStore('tags', { keyPath: 'id' });
      }
    },
  });
};

export const useStore = create<StoreState>((set, get) => ({
  inspirations: [],
  projects: [],
  tasks: [],
  progressLogs: [],
  tags: [],
  dbReady: false,
  db: null,

  initDB: async () => {
    if (get().dbReady) return;
    const db = await initIndexedDB();
    set({ db, dbReady: true });
    await get().loadAll();
  },

  loadAll: async () => {
    const { db } = get();
    if (!db) return;
    const [inspirations, projects, tasks, progressLogs, tags] = await Promise.all([
      db.getAllFromIndex('inspirations', 'createdAt'),
      db.getAll('projects'),
      db.getAll('tasks'),
      db.getAll('progressLogs'),
      db.getAll('tags'),
    ]);
    set({
      inspirations: inspirations.reverse(),
      projects: projects.sort((a, b) => b.createdAt - a.createdAt),
      tasks,
      progressLogs,
      tags,
    });
  },

  addInspiration: async (data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const item: Inspiration = { ...data, id: uuid(), createdAt: Date.now() };
    await db.add('inspirations', item);
    set((s) => ({ inspirations: [item, ...s.inspirations] }));
    return item;
  },

  updateInspiration: async (id, data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const existing = await db.get('inspirations', id);
    const updated = { ...existing, ...data };
    await db.put('inspirations', updated);
    set((s) => ({
      inspirations: s.inspirations.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteInspiration: async (id) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    await db.delete('inspirations', id);
    set((s) => ({ inspirations: s.inspirations.filter((i) => i.id !== id) }));
  },

  addProject: async (data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const item: Project = { ...data, id: uuid(), createdAt: Date.now() };
    await db.add('projects', item);
    set((s) => ({ projects: [item, ...s.projects] }));
    return item;
  },

  updateProject: async (id, data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const existing = await db.get('projects', id);
    const updated = { ...existing, ...data };
    await db.put('projects', updated);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const tx = db.transaction(['projects', 'tasks', 'progressLogs'], 'readwrite');
    await tx.objectStore('projects').delete(id);
    const tasks = await tx.objectStore('tasks').index('projectId').getAll(id);
    for (const task of tasks) {
      await tx.objectStore('tasks').delete(task.id);
      const logs = await tx.objectStore('progressLogs').index('taskId').getAll(task.id);
      for (const log of logs) {
        await tx.objectStore('progressLogs').delete(log.id);
      }
    }
    await tx.done;
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      progressLogs: s.progressLogs.filter(
        (l) => !tasks.some((t) => t.id === l.taskId),
      ),
    }));
  },

  addTask: async (data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const item: Task = { ...data, id: uuid() };
    await db.add('tasks', item);
    set((s) => ({ tasks: [...s.tasks, item] }));
    return item;
  },

  updateTask: async (id, data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const existing = await db.get('tasks', id);
    const updated = { ...existing, ...data };
    await db.put('tasks', updated);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const tx = db.transaction(['tasks', 'progressLogs'], 'readwrite');
    await tx.objectStore('tasks').delete(id);
    const logs = await tx.objectStore('progressLogs').index('taskId').getAll(id);
    for (const log of logs) {
      await tx.objectStore('progressLogs').delete(log.id);
    }
    const remainingTasks = await tx.objectStore('tasks').getAll();
    for (const task of remainingTasks) {
      if (task.dependencyIds.includes(id)) {
        const updated = {
          ...task,
          dependencyIds: task.dependencyIds.filter((d: string) => d !== id),
        };
        await tx.objectStore('tasks').put(updated);
      }
    }
    await tx.done;
    set((s) => ({
      tasks: s.tasks
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          dependencyIds: t.dependencyIds.filter((d) => d !== id),
        })),
      progressLogs: s.progressLogs.filter((l) => l.taskId !== id),
    }));
  },

  addProgressLog: async (data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const item: ProgressLog = { ...data, id: uuid(), createdAt: Date.now() };
    await db.add('progressLogs', item);
    set((s) => ({ progressLogs: [...s.progressLogs, item] }));
    return item;
  },

  updateProgressLog: async (id, data) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const existing = await db.get('progressLogs', id);
    const updated = { ...existing, ...data };
    await db.put('progressLogs', updated);
    set((s) => ({
      progressLogs: s.progressLogs.map((l) => (l.id === id ? updated : l)),
    }));
  },

  deleteProgressLog: async (id) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    await db.delete('progressLogs', id);
    set((s) => ({ progressLogs: s.progressLogs.filter((l) => l.id !== id) }));
  },

  addTag: async (name) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const existing = get().tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const item: Tag = { id: uuid(), name };
    await db.add('tags', item);
    set((s) => ({ tags: [...s.tags, item] }));
    return item;
  },

  getOrCreateTag: async (name) => {
    const existing = get().tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    return get().addTag(name);
  },

  exportData: async () => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const data: AppData = {
      inspirations: await db.getAll('inspirations'),
      projects: await db.getAll('projects'),
      tasks: await db.getAll('tasks'),
      progressLogs: await db.getAll('progressLogs'),
      tags: await db.getAll('tags'),
    };
    const json = JSON.stringify(data, null, 2);
    const zip = new JSZip();
    zip.file('creative-forge-data.json', json);
    return zip.generateAsync({ type: 'blob' });
  },

  importData: async (file: File) => {
    const { db } = get();
    if (!db) throw new Error('DB not ready');
    const zip = await JSZip.loadAsync(file);
    const jsonFile = zip.file('creative-forge-data.json');
    if (!jsonFile) throw new Error('Invalid backup file');
    const json = await jsonFile.async('text');
    const data: AppData = JSON.parse(json);
    const tx = db.transaction(
      ['inspirations', 'projects', 'tasks', 'progressLogs', 'tags'],
      'readwrite',
    );
    for (const item of data.inspirations) await tx.objectStore('inspirations').put(item);
    for (const item of data.projects) await tx.objectStore('projects').put(item);
    for (const item of data.tasks) await tx.objectStore('tasks').put(item);
    for (const item of data.progressLogs) await tx.objectStore('progressLogs').put(item);
    for (const item of data.tags) await tx.objectStore('tags').put(item);
    await tx.done;
    await get().loadAll();
  },

  inspirationToProject: async (inspirationId) => {
    const inspiration = get().inspirations.find((i) => i.id === inspirationId);
    if (!inspiration) throw new Error('Inspiration not found');
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return get().addProject({
      title: inspiration.title,
      description: inspiration.description,
      priority: 'medium',
      startDate: now,
      endDate: now + oneWeek,
      sourceInspirationId: inspiration.id,
    });
  },
}));
