import { get, set } from 'idb-keyval';
import type { User, Skill, Task, Rating } from '../types';

export const dbKeys = {
  CURRENT_USER: 'current_user',
  SKILLS: 'skills',
  TASKS: 'tasks',
  RATINGS: 'ratings',
  IS_INITIALIZED: 'is_initialized',
} as const;

export async function getCurrentUser(): Promise<User> {
  const user = await get<User>(dbKeys.CURRENT_USER);
  return user as User;
}

export async function saveCurrentUser(user: User): Promise<void> {
  await set(dbKeys.CURRENT_USER, user);
}

export async function getSkills(): Promise<Skill[]> {
  const skills = await get<Skill[]>(dbKeys.SKILLS);
  return skills || [];
}

export async function saveSkills(skills: Skill[]): Promise<void> {
  await set(dbKeys.SKILLS, skills);
}

export async function getTasks(): Promise<Task[]> {
  const tasks = await get<Task[]>(dbKeys.TASKS);
  return tasks || [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await set(dbKeys.TASKS, tasks);
}

export async function getRatings(): Promise<Rating[]> {
  const ratings = await get<Rating[]>(dbKeys.RATINGS);
  return ratings || [];
}

export async function saveRatings(ratings: Rating[]): Promise<void> {
  await set(dbKeys.RATINGS, ratings);
}

export async function isInitialized(): Promise<boolean> {
  const initialized = await get<boolean>(dbKeys.IS_INITIALIZED);
  return initialized === true;
}

export async function setInitialized(): Promise<void> {
  await set(dbKeys.IS_INITIALIZED, true);
}
