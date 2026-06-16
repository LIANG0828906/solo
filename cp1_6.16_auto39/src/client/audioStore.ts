import { v4 as uuidv4 } from 'uuid';
import type { AudioClip } from './types';

const DB_NAME = 'PodcastStudioDB';
const DB_VERSION = 2;
const CLIPS_STORE = 'clips';
const FILES_STORE = 'audioFiles';
const FILE_CHUNKS_STORE = 'audioFileChunks';
const CHUNK_SIZE = 4 * 1024 * 1024;

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

export const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbOpenPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => { dbInstance = null; };
      dbInstance.onerror = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(CLIPS_STORE)) {
        db.createObjectStore(CLIPS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(FILE_CHUNKS_STORE)) {
        db.createObjectStore(FILE_CHUNKS_STORE, { keyPath: 'chunkId' });
      }
    };
  });

  return dbOpenPromise;
};

export const saveClip = async (clip: Omit<AudioClip, 'id'>): Promise<AudioClip> => {
  const db = await openDB();
  const newClip: AudioClip = { ...clip, id: uuidv4() };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CLIPS_STORE, 'readwrite');
    const store = transaction.objectStore(CLIPS_STORE);
    const request = store.add(newClip);

    request.onsuccess = () => resolve(newClip);
    request.onerror = () => reject(request.error);
  });
};

export const getAllClips = async (): Promise<AudioClip[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CLIPS_STORE, 'readonly');
    const store = transaction.objectStore(CLIPS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as AudioClip[]);
    request.onerror = () => reject(request.error);
  });
};

export const deleteClip = async (id: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CLIPS_STORE, 'readwrite');
    const store = transaction.objectStore(CLIPS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const batchSaveClips = async (clips: Omit<AudioClip, 'id'>[]): Promise<AudioClip[]> => {
  const db = await openDB();
  const newClips: AudioClip[] = clips.map((clip) => ({ ...clip, id: uuidv4() }));

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CLIPS_STORE, 'readwrite');
    const store = transaction.objectStore(CLIPS_STORE);

    for (const clip of newClips) {
      store.add(clip);
    }

    transaction.oncomplete = () => resolve(newClips);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const batchDeleteClips = async (ids: string[]): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CLIPS_STORE, 'readwrite');
    const store = transaction.objectStore(CLIPS_STORE);

    for (const id of ids) {
      store.delete(id);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveAudioFile = async (audioId: string, blob: Blob): Promise<void> => {
  const db = await openDB();

  if (blob.size > CHUNK_SIZE) {
    await saveAudioFileChunked(audioId, blob);
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.put({ id: audioId, blob });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const saveAudioFileChunked = async (audioId: string, blob: Blob): Promise<void> => {
  const db = await openDB();
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    store.put({ id: audioId, chunked: true, totalChunks, size: blob.size });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  const chunkPromises: Promise<void>[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, blob.size);
    const chunkBlob = blob.slice(start, end);
    const chunkId = `${audioId}_chunk_${i}`;

    chunkPromises.push(
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(FILE_CHUNKS_STORE, 'readwrite');
        const store = transaction.objectStore(FILE_CHUNKS_STORE);
        store.put({ chunkId, audioId, chunkIndex: i, blob: chunkBlob });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      })
    );

    if (chunkPromises.length >= 3) {
      await Promise.all(chunkPromises.splice(0));
    }
  }

  await Promise.all(chunkPromises);
};

export const getAudioFile = async (audioId: string): Promise<Blob | null> => {
  const db = await openDB();

  const metadata = await new Promise<any>((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(audioId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (!metadata) return null;

  if (!metadata.chunked) {
    return metadata.blob as Blob;
  }

  const chunks: Blob[] = [];
  for (let i = 0; i < metadata.totalChunks; i++) {
    const chunkId = `${audioId}_chunk_${i}`;
    const chunkData = await new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(FILE_CHUNKS_STORE, 'readonly');
      const store = transaction.objectStore(FILE_CHUNKS_STORE);
      const request = store.get(chunkId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (chunkData) {
      chunks.push(chunkData.blob as Blob);
    }
  }

  return new Blob(chunks);
};

export const deleteAudioFile = async (audioId: string): Promise<void> => {
  const db = await openDB();

  const metadata = await new Promise<any>((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(audioId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (metadata?.chunked) {
    const chunkIds = Array.from(
      { length: metadata.totalChunks },
      (_, i) => `${audioId}_chunk_${i}`
    );

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(FILE_CHUNKS_STORE, 'readwrite');
      const store = transaction.objectStore(FILE_CHUNKS_STORE);
      for (const chunkId of chunkIds) {
        store.delete(chunkId);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.delete(audioId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
