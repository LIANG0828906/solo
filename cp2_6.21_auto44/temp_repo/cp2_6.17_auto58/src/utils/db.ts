import type { Project, Comment, Like, Activity } from '../types';

const DB_NAME = 'CommSpaceDB';
const DB_VERSION = 1;
const STORES = {
  projects: 'projects',
  comments: 'comments',
  likes: 'likes',
  activities: 'activities',
} as const;

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.projects)) {
        const projectStore = db.createObjectStore(STORES.projects, { keyPath: 'id' });
        projectStore.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains(STORES.comments)) {
        const commentStore = db.createObjectStore(STORES.comments, { keyPath: 'id' });
        commentStore.createIndex('projectId', 'projectId');
        commentStore.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains(STORES.likes)) {
        const likeStore = db.createObjectStore(STORES.likes, { keyPath: 'id' });
        likeStore.createIndex('projectId', 'projectId');
        likeStore.createIndex('projectId_user', ['projectId', 'user'], { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.activities)) {
        const activityStore = db.createObjectStore(STORES.activities, { keyPath: 'id' });
        activityStore.createIndex('createdAt', 'createdAt');
      }
    };
  });
}

async function addToStore<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFromStoreByIndex<T>(
  storeName: string,
  indexName: string,
  value: string
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export const ProjectDB = {
  async add(project: Project): Promise<void> {
    await addToStore(STORES.projects, project);
  },
  async update(project: Project): Promise<void> {
    await addToStore(STORES.projects, project);
  },
  async delete(id: string): Promise<void> {
    await deleteFromStore(STORES.projects, id);
  },
  async getAll(): Promise<Project[]> {
    const projects = await getAllFromStore<Project>(STORES.projects);
    return projects.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};

export const CommentDB = {
  async add(comment: Comment): Promise<void> {
    await addToStore(STORES.comments, comment);
  },
  async getByProjectId(projectId: string): Promise<Comment[]> {
    const comments = await getFromStoreByIndex<Comment>(
      STORES.comments,
      'projectId',
      projectId
    );
    return comments.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },
  async getAll(): Promise<Comment[]> {
    return getAllFromStore<Comment>(STORES.comments);
  },
};

export const LikeDB = {
  async add(like: Like): Promise<void> {
    await addToStore(STORES.likes, like);
  },
  async delete(id: string): Promise<void> {
    await deleteFromStore(STORES.likes, id);
  },
  async getByProjectId(projectId: string): Promise<Like[]> {
    return getFromStoreByIndex<Like>(STORES.likes, 'projectId', projectId);
  },
  async getAll(): Promise<Like[]> {
    return getAllFromStore<Like>(STORES.likes);
  },
};

export const ActivityDB = {
  async add(activity: Activity): Promise<void> {
    await addToStore(STORES.activities, activity);
  },
  async getAll(): Promise<Activity[]> {
    const activities = await getAllFromStore<Activity>(STORES.activities);
    return activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};
