import { Article, Highlight, Note, Link } from './types';

const DB_NAME = 'reading-notes-db';
const DB_VERSION = 1;
const STORES = {
  articles: 'articles',
  highlights: 'highlights',
  notes: 'notes',
  links: 'links',
} as const;

let db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORES.articles)) {
        database.createObjectStore(STORES.articles, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORES.highlights)) {
        const store = database.createObjectStore(STORES.highlights, { keyPath: 'id' });
        store.createIndex('articleId', 'articleId', { unique: false });
      }
      if (!database.objectStoreNames.contains(STORES.notes)) {
        const store = database.createObjectStore(STORES.notes, { keyPath: 'id' });
        store.createIndex('articleId', 'articleId', { unique: false });
        store.createIndex('highlightId', 'highlightId', { unique: false });
      }
      if (!database.objectStoreNames.contains(STORES.links)) {
        const store = database.createObjectStore(STORES.links, { keyPath: 'id' });
        store.createIndex('articleId', 'articleId', { unique: false });
      }
    };
  });
}

function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return new Promise(async (resolve, reject) => {
    const database = await openDB();
    const tx = database.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveArticle(article: Article): Promise<void> {
  await runTx(STORES.articles, 'readwrite', (store) => store.put(article));
}

export async function getArticle(id: string): Promise<Article | undefined> {
  const result = await runTx<Article | undefined>(STORES.articles, 'readonly', (store) =>
    store.get(id),
  );
  return result as Article | undefined;
}

export async function saveHighlight(highlight: Highlight): Promise<void> {
  await runTx(STORES.highlights, 'readwrite', (store) => store.put(highlight));
}

export async function deleteHighlight(id: string): Promise<void> {
  await runTx(STORES.highlights, 'readwrite', (store) => store.delete(id));
}

export async function getHighlights(articleId: string): Promise<Highlight[]> {
  return new Promise(async (resolve, reject) => {
    const database = await openDB();
    const tx = database.transaction(STORES.highlights, 'readonly');
    const store = tx.objectStore(STORES.highlights);
    const index = store.index('articleId');
    const request = index.getAll(articleId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveNote(note: Note): Promise<void> {
  await runTx(STORES.notes, 'readwrite', (store) => store.put(note));
}

export async function deleteNote(id: string): Promise<void> {
  await runTx(STORES.notes, 'readwrite', (store) => store.delete(id));
}

export async function getNotes(articleId: string): Promise<Note[]> {
  return new Promise(async (resolve, reject) => {
    const database = await openDB();
    const tx = database.transaction(STORES.notes, 'readonly');
    const store = tx.objectStore(STORES.notes);
    const index = store.index('articleId');
    const request = index.getAll(articleId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLink(link: Link): Promise<void> {
  await runTx(STORES.links, 'readwrite', (store) => store.put(link));
}

export async function deleteLink(id: string): Promise<void> {
  await runTx(STORES.links, 'readwrite', (store) => store.delete(id));
}

export async function getLinks(articleId: string): Promise<Link[]> {
  return new Promise(async (resolve, reject) => {
    const database = await openDB();
    const tx = database.transaction(STORES.links, 'readonly');
    const store = tx.objectStore(STORES.links);
    const index = store.index('articleId');
    const request = index.getAll(articleId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
