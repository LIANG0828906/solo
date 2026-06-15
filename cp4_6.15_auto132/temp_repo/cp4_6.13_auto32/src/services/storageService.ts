import { Feed, Article, ReadingProgress } from '../types';

const DB_NAME = 'PaperReadDB';
const DB_VERSION = 1;

interface DBSchema {
  feeds: { key: string; value: Feed; indexes: { 'by-url': string } };
  articles: { key: string; value: Article; indexes: { 'by-feedId': string; 'by-isRead': string; 'by-isFavorite': string } };
  readingProgress: { key: string; value: ReadingProgress; indexes: {} };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('feeds')) {
        const feedsStore = db.createObjectStore('feeds', { keyPath: 'id' });
        feedsStore.createIndex('by-url', 'url', { unique: true });
      }
      
      if (!db.objectStoreNames.contains('articles')) {
        const articlesStore = db.createObjectStore('articles', { keyPath: 'id' });
        articlesStore.createIndex('by-feedId', 'feedId', { unique: false });
        articlesStore.createIndex('by-isRead', 'isRead', { unique: false });
        articlesStore.createIndex('by-isFavorite', 'isFavorite', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('readingProgress')) {
        db.createObjectStore('readingProgress', { keyPath: 'articleId' });
      }
    };
  });
  
  return dbPromise;
}

async function transaction<T>(
  storeNames: Array<keyof DBSchema>,
  mode: IDBTransactionMode,
  callback: (stores: { [K in keyof DBSchema]: IDBObjectStore }) => Promise<T> | T
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const stores: { [K in keyof DBSchema]: IDBObjectStore } = {} as { [K in keyof DBSchema]: IDBObjectStore };
    
    for (const name of storeNames) {
      stores[name] = tx.objectStore(name);
    }
    
    tx.oncomplete = () => resolve(result as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    
    let result: T;
    try {
      result = callback(stores) as T;
      if (result instanceof Promise) {
        result.then(resolve, reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

export async function getFeeds(): Promise<Feed[]> {
  return transaction(['feeds'], 'readonly', (stores) => {
    return new Promise((resolve, reject) => {
      const request = stores.feeds.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function addFeed(feed: Feed, articles: Article[]): Promise<void> {
  return transaction(['feeds', 'articles'], 'readwrite', (stores) => {
    stores.feeds.put(feed);
    for (const article of articles) {
      stores.articles.put(article);
    }
  });
}

export async function deleteFeed(feedId: string): Promise<void> {
  return transaction(['feeds', 'articles', 'readingProgress'], 'readwrite', async (stores) => {
    stores.feeds.delete(feedId);
    
    const articlesRequest = stores.articles.index('by-feedId').getAll(feedId);
    const articles = await new Promise<Article[]>((resolve, reject) => {
      articlesRequest.onsuccess = () => resolve(articlesRequest.result);
      articlesRequest.onerror = () => reject(articlesRequest.error);
    });
    
    for (const article of articles) {
      stores.articles.delete(article.id);
      stores.readingProgress.delete(article.id);
    }
  });
}

export async function getArticles(): Promise<Article[]> {
  return transaction(['articles'], 'readonly', (stores) => {
    return new Promise((resolve, reject) => {
      const request = stores.articles.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function updateArticles(articles: Article[]): Promise<void> {
  return transaction(['articles'], 'readwrite', (stores) => {
    for (const article of articles) {
      stores.articles.put(article);
    }
  });
}

export async function updateArticle(article: Partial<Article> & { id: string }): Promise<void> {
  return transaction(['articles'], 'readwrite', async (stores) => {
    const request = stores.articles.get(article.id);
    const existing = await new Promise<Article | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (existing) {
      stores.articles.put({ ...existing, ...article });
    }
  });
}

export async function updateFeed(feed: Partial<Feed> & { id: string }): Promise<void> {
  return transaction(['feeds'], 'readwrite', async (stores) => {
    const request = stores.feeds.get(feed.id);
    const existing = await new Promise<Feed | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (existing) {
      stores.feeds.put({ ...existing, ...feed });
    }
  });
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  return transaction(['readingProgress'], 'readwrite', (stores) => {
    stores.readingProgress.put(progress);
  });
}

export async function loadReadingProgress(articleId: string): Promise<ReadingProgress | null> {
  return transaction(['readingProgress'], 'readonly', (stores) => {
    return new Promise((resolve, reject) => {
      const request = stores.readingProgress.get(articleId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  return transaction(['readingProgress'], 'readonly', (stores) => {
    return new Promise((resolve, reject) => {
      const request = stores.readingProgress.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}
