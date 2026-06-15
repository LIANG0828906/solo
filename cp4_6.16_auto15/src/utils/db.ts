import { createStore, get, set, del, keys, entries } from "idb-keyval";

const DB_NAME = "meeting-app-db";

export const MEETINGS_STORE = createStore(DB_NAME, "meetings");
export const TODOS_STORE = createStore(DB_NAME, "todos");

export async function getAllItems<T>(store: IDBObjectStore): Promise<T[]> {
  const all = await entries<string, T>(store);
  return all.map(([, value]) => value);
}

export async function getItem<T>(key: string, store: IDBObjectStore): Promise<T | undefined> {
  return get<T>(key, store);
}

export async function setItem<T>(key: string, value: T, store: IDBObjectStore): Promise<void> {
  await set(key, value, store);
}

export async function deleteItem(key: string, store: IDBObjectStore): Promise<void> {
  await del(key, store);
}

export async function getAllKeys(store: IDBObjectStore): Promise<string[]> {
  return keys<string>(store);
}
