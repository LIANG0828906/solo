import { get, set, del, keys, clear } from 'idb-keyval';
import type { User, Skill, ExchangeRequest, Message, Review } from '../types';

const STORES = {
  users: 'users',
  skills: 'skills',
  exchangeRequests: 'exchangeRequests',
  messages: 'messages',
  reviews: 'reviews',
  currentUser: 'currentUser',
} as const;

export async function getAllUsers(): Promise<User[]> {
  const users = await get<User[]>(STORES.users);
  return users || [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await set(STORES.users, users);
}

export async function getAllSkills(): Promise<Skill[]> {
  const skills = await get<Skill[]>(STORES.skills);
  return skills || [];
}

export async function saveSkills(skills: Skill[]): Promise<void> {
  await set(STORES.skills, skills);
}

export async function getAllExchangeRequests(): Promise<ExchangeRequest[]> {
  const requests = await get<ExchangeRequest[]>(STORES.exchangeRequests);
  return requests || [];
}

export async function saveExchangeRequests(
  requests: ExchangeRequest[]
): Promise<void> {
  await set(STORES.exchangeRequests, requests);
}

export async function getAllMessages(): Promise<Message[]> {
  const messages = await get<Message[]>(STORES.messages);
  return messages || [];
}

export async function saveMessages(messages: Message[]): Promise<void> {
  await set(STORES.messages, messages);
}

export async function getAllReviews(): Promise<Review[]> {
  const reviews = await get<Review[]>(STORES.reviews);
  return reviews || [];
}

export async function saveReviews(reviews: Review[]): Promise<void> {
  await set(STORES.reviews, reviews);
}

export async function getCurrentUserId(): Promise<string | null> {
  const userId = await get<string>(STORES.currentUser);
  return userId || null;
}

export async function setCurrentUserId(userId: string): Promise<void> {
  await set(STORES.currentUser, userId);
}

export async function clearCurrentUser(): Promise<void> {
  await del(STORES.currentUser);
}

export async function clearAllData(): Promise<void> {
  await clear();
}
