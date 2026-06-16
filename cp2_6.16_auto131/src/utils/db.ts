import { get, set, del, keys, clear } from 'idb-keyval';
import type { Task, TimeEntry, User } from './types';

const TASKS_KEY = 'teamtally_tasks';
const TIME_ENTRIES_KEY = 'teamtally_time_entries';
const USERS_KEY = 'teamtally_users';
const CURRENT_USER_KEY = 'teamtally_current_user';

export async function getTasks(): Promise<Task[]> {
  const tasks = await get<string>(TASKS_KEY);
  return tasks ? JSON.parse(tasks) : [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await set(TASKS_KEY, JSON.stringify(tasks));
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const entries = await get<string>(TIME_ENTRIES_KEY);
  return entries ? JSON.parse(entries) : [];
}

export async function saveTimeEntries(entries: TimeEntry[]): Promise<void> {
  await set(TIME_ENTRIES_KEY, JSON.stringify(entries));
}

export async function getUsers(): Promise<User[]> {
  const users = await get<string>(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await set(USERS_KEY, JSON.stringify(users));
}

export async function getCurrentUserId(): Promise<string | null> {
  const userId = await get<string>(CURRENT_USER_KEY);
  return userId || null;
}

export async function setCurrentUserId(userId: string | null): Promise<void> {
  if (userId) {
    await set(CURRENT_USER_KEY, userId);
  } else {
    await del(CURRENT_USER_KEY);
  }
}

export async function clearAllData(): Promise<void> {
  await clear();
}

export async function getAllKeys(): Promise<IDBValidKey[]> {
  return await keys();
}
