import type { DocumentItem, AnnotationItem, ReplyItem } from '@/types';

const DB_NAME = 'collabnote-db';
const DB_VERSION = 1;

const STORE_DOCUMENTS = 'documents';
const STORE_ANNOTATIONS = 'annotations';
const STORE_REPLIES = 'replies';

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

      if (!database.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = database.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORE_ANNOTATIONS)) {
        const annStore = database.createObjectStore(STORE_ANNOTATIONS, { keyPath: 'id' });
        annStore.createIndex('documentId', 'documentId', { unique: false });
        annStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORE_REPLIES)) {
        const replyStore = database.createObjectStore(STORE_REPLIES, { keyPath: 'id' });
        replyStore.createIndex('annotationId', 'annotationId', { unique: false });
        replyStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DOCUMENTS, 'readonly');
    const store = transaction.objectStore(STORE_DOCUMENTS);
    const index = store.index('updatedAt');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result.reverse());
    request.onerror = () => reject(request.error);
  });
}

export async function addDocument(doc: DocumentItem): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = transaction.objectStore(STORE_DOCUMENTS);
    const request = store.add(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateDocument(doc: DocumentItem): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = transaction.objectStore(STORE_DOCUMENTS);
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = transaction.objectStore(STORE_DOCUMENTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAnnotationsByDocument(documentId: string): Promise<AnnotationItem[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_ANNOTATIONS, 'readonly');
    const store = transaction.objectStore(STORE_ANNOTATIONS);
    const index = store.index('documentId');
    const request = index.getAll(documentId);

    request.onsuccess = () => {
      const annotations = request.result;
      annotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(annotations);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addAnnotation(annotation: AnnotationItem): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_ANNOTATIONS, 'readwrite');
    const store = transaction.objectStore(STORE_ANNOTATIONS);
    const request = store.add(annotation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateAnnotation(annotation: AnnotationItem): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_ANNOTATIONS, 'readwrite');
    const store = transaction.objectStore(STORE_ANNOTATIONS);
    const request = store.put(annotation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_ANNOTATIONS, 'readwrite');
    const store = transaction.objectStore(STORE_ANNOTATIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addReply(reply: ReplyItem): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_REPLIES, 'readwrite');
    const store = transaction.objectStore(STORE_REPLIES);
    const request = store.add(reply);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getRepliesByAnnotation(annotationId: string): Promise<ReplyItem[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_REPLIES, 'readonly');
    const store = transaction.objectStore(STORE_REPLIES);
    const index = store.index('annotationId');
    const request = index.getAll(annotationId);

    request.onsuccess = () => {
      const replies = request.result;
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(replies);
    };
    request.onerror = () => reject(request.error);
  });
}
