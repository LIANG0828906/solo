import { User } from './types';

export const USERS: User[] = [
  { id: 'user-1', name: '张三', color: '#3B82F6', avatar: '张' },
  { id: 'user-2', name: '李四', color: '#F43F5E', avatar: '李' },
  { id: 'user-3', name: '王五', color: '#10B981', avatar: '王' },
];

export const getCurrentUser = (): User => {
  const stored = localStorage.getItem('collab-user');
  if (stored) {
    return JSON.parse(stored);
  }
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  localStorage.setItem('collab-user', JSON.stringify(user));
  return user;
};

export const getOtherUsers = (currentUserId: string): User[] => {
  return USERS.filter(u => u.id !== currentUserId);
};
