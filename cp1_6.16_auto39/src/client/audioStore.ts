import { v4 as uuidv4 } from 'uuid';
import type { AudioClip } from './types';

const DB_NAME = 'PodcastStudioDB';
const DB_VERSION = 1;
const CLIPS_STORE = 'clips';
const FILES_STORE = 'audioFiles';

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(CLIPS_STORE)) {
        db.createObjectStore(CLIPS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }
    };
  });
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

export const saveAudioFile = async (audioId: string, blob: Blob): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.put({ id: audioId, blob });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAudioFile = async (audioId: string): Promise<Blob | null> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(audioId);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.blob : null);
    };
    request.onerror = () => reject(request.error);
  });
};
