import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../utils/types';
import { AVATAR_EMOJIS, NICKNAMES, USER_COLORS } from '../utils/types';

const STORAGE_KEY = 'brainstorm_user_identity';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateUser = (): User => {
  return {
    id: uuidv4(),
    name: getRandomItem(NICKNAMES),
    avatar: getRandomItem(AVATAR_EMOJIS),
    color: getRandomItem(USER_COLORS),
  };
};

export const useUserIdentity = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.id && parsed.name && parsed.avatar && parsed.color) {
          setUser(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored user identity:', e);
      }
    }

    const newUser = generateUser();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const regenerateUser = () => {
    const newUser = generateUser();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  return {
    user,
    regenerateUser,
  };
};
