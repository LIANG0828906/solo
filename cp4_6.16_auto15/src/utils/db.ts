import { createStore, get, set, del, keys, entries, UseStore } from 'idb-keyval';

const DB_NAME = 'meeting-notes-db-v1';

export const meetingsStore: UseStore = createStore(DB_NAME, 'meetings');
export const todosStore: UseStore = createStore(DB_NAME, 'todos');

export async function getAllItems<T>(store: UseStore): Promise<T[]> {
  const all = await entries<string, T>(store);
  return all.map(([, value]) => value);
}

export async function getItem<T>(key: string, store: UseStore): Promise<T | undefined> {
  return get<T>(key, store);
}

export async function setItem<T>(key: string, value: T, store: UseStore): Promise<void> {
  await set(key, value, store);
}

export async function deleteItem(key: string, store: UseStore): Promise<void> {
  await del(key, store);
}

export async function getAllKeys(store: UseStore): Promise<string[]> {
  return keys<string>(store);
}
