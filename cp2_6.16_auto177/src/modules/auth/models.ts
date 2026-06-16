export interface User {
  id: string;
  name: string;
  avatar: string;
  contact: string;
  joinDate: string;
  rating: number;
  itemCount: number;
  password: string;
}

export interface RegisterInput {
  name: string;
  avatar: string;
  contact?: string;
  password?: string;
}

export interface LoginInput {
  name: string;
  password: string;
}

import { v4 as uuidv4 } from 'uuid';
import {
  addRecord,
  getAllRecords,
  getRecordsByIndex,
  putRecord,
} from '@/utils/db';
import { validateUsername, validateContact } from '@/utils/validators';

const DEFAULT_PASSWORD = 'pass123';
const AVATAR_OPTIONS = ['😀', '😎', '🐱', '🐶', '🦊', '🐼'];

export function getAvatarOptions(): string[] {
  return AVATAR_OPTIONS;
}

export async function registerUser(input: RegisterInput): Promise<User> {
  const nameCheck = validateUsername(input.name);
  if (!nameCheck.valid) throw new Error(nameCheck.message);

  const contactCheck = validateContact(input.contact || '');
  if (!contactCheck.valid) throw new Error(contactCheck.message);

  const existing = await getRecordsByIndex<User>('users', 'name', input.name);
  if (existing.length > 0) throw new Error('该用户名已被注册');

  const user: User = {
    id: uuidv4(),
    name: input.name,
    avatar: input.avatar,
    contact: input.contact || '',
    joinDate: new Date().toISOString(),
    rating: 1,
    itemCount: 0,
    password: input.password || DEFAULT_PASSWORD,
  };

  await addRecord<User>('users', user);
  return user;
}

export async function loginUser(input: LoginInput): Promise<User> {
  const users = await getRecordsByIndex<User>('users', 'name', input.name);
  if (users.length === 0) throw new Error('用户名不存在');

  const user = users[0];
  if (user.password !== input.password) throw new Error('密码错误');

  return user;
}

export async function updateUserContact(userId: string, contact: string): Promise<User> {
  const contactCheck = validateContact(contact);
  if (!contactCheck.valid) throw new Error(contactCheck.message);

  const allUsers = await getAllRecords<User>('users');
  const user = allUsers.find((u) => u.id === userId);
  if (!user) throw new Error('用户不存在');

  const updated: User = { ...user, contact };
  await putRecord<User>('users', updated);
  return updated;
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<User> {
  if (!newPassword || newPassword.length < 6) throw new Error('密码至少6位');

  const allUsers = await getAllRecords<User>('users');
  const user = allUsers.find((u) => u.id === userId);
  if (!user) throw new Error('用户不存在');

  const updated: User = { ...user, password: newPassword };
  await putRecord<User>('users', updated);
  return updated;
}

export async function updateUserRating(userId: string, delta: number): Promise<User> {
  const allUsers = await getAllRecords<User>('users');
  const user = allUsers.find((u) => u.id === userId);
  if (!user) throw new Error('用户不存在');

  const updated: User = { ...user, rating: Math.max(1, user.rating + delta) };
  await putRecord<User>('users', updated);
  return updated;
}

export async function incrementUserItemCount(userId: string, delta = 1): Promise<User> {
  const allUsers = await getAllRecords<User>('users');
  const user = allUsers.find((u) => u.id === userId);
  if (!user) throw new Error('用户不存在');

  const updated: User = { ...user, itemCount: Math.max(0, user.itemCount + delta) };
  await putRecord<User>('users', updated);
  return updated;
}

export async function getAllUsers(): Promise<User[]> {
  return getAllRecords<User>('users');
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getAllRecords<User>('users');
  return users.find((u) => u.id === id);
}

export async function seedDemoUsers(): Promise<void> {
  const users = await getAllRecords<User>('users');
  if (users.length > 0) return;

  const demoUsers: RegisterInput[] = [
    { name: '小明', avatar: '😀', contact: '13800138000', password: 'pass123' },
    { name: 'Alice', avatar: '😎', contact: 'alice@test.com', password: 'pass123' },
    { name: '猫奴', avatar: '🐱', contact: '', password: 'pass123' },
    { name: '汪星人', avatar: '🐶', contact: '13900139000', password: 'pass123' },
  ];

  for (const u of demoUsers) {
    await registerUser(u);
  }
}
