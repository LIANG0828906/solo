import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string;
  projectName: string;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
}

interface BoardColumn {
  id: TaskStatus;
  title: string;
  taskIds: string[];
}

interface KanbanDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
  columns: {
    key: string;
    value: BoardColumn;
  };
  members: {
    key: string;
    value: Member;
  };
}

const DB_NAME = 'kanban-db';
const DB_VERSION = 1;

let db: IDBPDatabase<KanbanDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<KanbanDB>> {
  if (db) return db;

  db = await openDB<KanbanDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('columns')) {
        db.createObjectStore('columns', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('members')) {
        db.createObjectStore('members', { keyPath: 'id' });
      }
    },
  });

  return db;
}

export async function saveTasks(tasks: Record<string, Task>): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('tasks', 'readwrite');
  await Promise.all(Object.values(tasks).map(task => tx.store.put(task)));
  await tx.done;
}

export async function loadTasks(): Promise<Record<string, Task>> {
  const database = await initDB();
  const all = await database.getAll('tasks');
  const result: Record<string, Task> = {};
  all.forEach(t => { result[t.id] = t; });
  return result;
}

export async function saveColumns(columns: Record<TaskStatus, BoardColumn>): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('columns', 'readwrite');
  await Promise.all(Object.values(columns).map(col => tx.store.put(col)));
  await tx.done;
}

export async function loadColumns(): Promise<Record<TaskStatus, BoardColumn> | null> {
  const database = await initDB();
  const all = await database.getAll('columns');
  if (all.length === 0) return null;
  const result: Record<string, BoardColumn> = {};
  all.forEach(c => { result[c.id] = c; });
  return result as Record<TaskStatus, BoardColumn>;
}

export async function saveMembers(members: Member[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('members', 'readwrite');
  await Promise.all(members.map(m => tx.store.put(m)));
  await tx.done;
}

export async function loadMembers(): Promise<Member[]> {
  const database = await initDB();
  return await database.getAll('members');
}
