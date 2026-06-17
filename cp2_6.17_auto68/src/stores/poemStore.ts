import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Poem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface PoemStore {
  poems: Poem[];
  currentPoem: Poem | null;
  isLoading: boolean;
  dbReady: boolean;
  initDB: () => void;
  loadPoems: () => Promise<void>;
  getPoem: (id: string) => Poem | undefined;
  createPoem: () => Promise<Poem>;
  updatePoem: (id: string, title: string, content: string) => Promise<void>;
  deletePoem: (id: string) => Promise<void>;
  setCurrentPoem: (poem: Poem | null) => void;
}

const DB_NAME = 'WindWhisperDB';
const STORE_NAME = 'poems';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };
  });
};

const getAllFromDB = async (): Promise<Poem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Poem[]);
    request.onerror = () => reject(request.error);
  });
};

const addToDB = async (poem: Poem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(poem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const putToDB = async (poem: Poem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(poem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const usePoemStore = create<PoemStore>((set, get) => ({
  poems: [],
  currentPoem: null,
  isLoading: false,
  dbReady: false,

  initDB: () => {
    openDB()
      .then(() => {
        set({ dbReady: true });
        get().loadPoems();
      })
      .catch((err) => {
        console.error('Failed to initialize IndexedDB:', err);
      });
  },

  loadPoems: async () => {
    set({ isLoading: true });
    try {
      const poems = await getAllFromDB();
      set({ poems, isLoading: false });
    } catch (err) {
      console.error('Failed to load poems:', err);
      set({ isLoading: false });
    }
  },

  getPoem: (id: string) => {
    return get().poems.find((p) => p.id === id);
  },

  createPoem: async () => {
    const now = Date.now();
    const newPoem: Poem = {
      id: uuidv4(),
      title: '无题',
      content: '',
      createdAt: now,
      updatedAt: now
    };
    await addToDB(newPoem);
    set((state) => ({
      poems: [newPoem, ...state.poems],
      currentPoem: newPoem
    }));
    return newPoem;
  },

  updatePoem: async (id: string, title: string, content: string) => {
    const state = get();
    const existing = state.poems.find((p) => p.id === id);
    if (!existing) return;

    const updated: Poem = {
      ...existing,
      title: title || '无题',
      content,
      updatedAt: Date.now()
    };

    await putToDB(updated);
    set((s) => ({
      poems: s.poems.map((p) => (p.id === id ? updated : p)),
      currentPoem: s.currentPoem?.id === id ? updated : s.currentPoem
    }));
  },

  deletePoem: async (id: string) => {
    await deleteFromDB(id);
    set((state) => ({
      poems: state.poems.filter((p) => p.id !== id),
      currentPoem: state.currentPoem?.id === id ? null : state.currentPoem
    }));
  },

  setCurrentPoem: (poem: Poem | null) => {
    set({ currentPoem: poem });
  }
}));
