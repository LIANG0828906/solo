import type { Room, User, Highlight, Message } from './types';

const DB_NAME = 'bookCoReadingDB';
const DB_VERSION = 1;

const STORE_ROOMS = 'rooms';
const STORE_USERS = 'users';
const STORE_HIGHLIGHTS = 'highlights';
const STORE_MESSAGES = 'messages';

class Storage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_ROOMS)) {
          const store = db.createObjectStore(STORE_ROOMS, { keyPath: 'id' });
          store.createIndex('lastActive', 'lastActive');
        }

        if (!db.objectStoreNames.contains(STORE_USERS)) {
          const store = db.createObjectStore(STORE_USERS, { keyPath: 'id' });
          store.createIndex('roomId', 'roomId');
          store.createIndex('lastActive', 'lastActive');
        }

        if (!db.objectStoreNames.contains(STORE_HIGHLIGHTS)) {
          const store = db.createObjectStore(STORE_HIGHLIGHTS, { keyPath: 'id' });
          store.createIndex('roomId', 'roomId');
          store.createIndex('paragraphIndex', 'paragraphIndex');
        }

        if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
          const store = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
          store.createIndex('roomId', 'roomId');
          store.createIndex('createdAt', 'createdAt');
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getRooms(): Promise<Room[]> {
    return this.getAll<Room>(STORE_ROOMS);
  }

  async putRoom(room: Room): Promise<void> {
    return this.put(STORE_ROOMS, room);
  }

  async getUsersByRoom(roomId: string): Promise<User[]> {
    return this.getByIndex<User>(STORE_USERS, 'roomId', roomId);
  }

  async putUser(user: User): Promise<void> {
    return this.put(STORE_USERS, user);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.delete(STORE_USERS, userId);
  }

  async getHighlightsByRoom(roomId: string): Promise<Highlight[]> {
    return this.getByIndex<Highlight>(STORE_HIGHLIGHTS, 'roomId', roomId);
  }

  async putHighlight(highlight: Highlight): Promise<void> {
    return this.put(STORE_HIGHLIGHTS, highlight);
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return this.getByIndex<Message>(STORE_MESSAGES, 'roomId', roomId);
  }

  async putMessage(message: Message): Promise<void> {
    return this.put(STORE_MESSAGES, message);
  }
}

export const storage = new Storage();
