import { v4 as uuidv4 } from 'uuid';
import type { User, Skill } from '../../types';
import { getAvatarColor } from '../../utils/avatar';
import {
  getAllUsers,
  saveUsers,
  getCurrentUserId,
  setCurrentUserId,
  clearCurrentUser,
} from '../../utils/storage';
import { SkillModule } from '../skill/SkillModule';

export const UserModule = {
  async register(username: string, description: string = ''): Promise<User> {
    const users = await getAllUsers();
    const existingUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (existingUser) {
      return existingUser;
    }
    const newUser: User = {
      id: uuidv4(),
      username,
      description,
      avatarColor: getAvatarColor(username),
      createdAt: Date.now(),
      averageRating: 0,
      reviewCount: 0,
    };
    users.push(newUser);
    await saveUsers(users);
    await setCurrentUserId(newUser.id);
    return newUser;
  },

  async login(username: string): Promise<User | null> {
    const users = await getAllUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (user) {
      await setCurrentUserId(user.id);
      return user;
    }
    return null;
  },

  async logout(): Promise<void> {
    await clearCurrentUser();
  },

  async getCurrentUser(): Promise<User | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    return this.getUserById(userId);
  },

  async getUserById(userId: string): Promise<User | null> {
    const users = await getAllUsers();
    return users.find((u) => u.id === userId) || null;
  },

  async updateUser(
    userId: string,
    data: Partial<Pick<User, 'username' | 'description'>>
  ): Promise<User | null> {
    const users = await getAllUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    const updatedUser = {
      ...users[index],
      ...data,
    };
    if (data.username) {
      updatedUser.avatarColor = getAvatarColor(data.username);
    }
    users[index] = updatedUser;
    await saveUsers(users);
    return updatedUser;
  },

  async updateUserRating(userId: string): Promise<void> {
    const users = await getAllUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return;
  },

  async getUserSkills(userId: string): Promise<Skill[]> {
    return SkillModule.getUserSkills(userId);
  },

  async getAllUsers(): Promise<User[]> {
    return getAllUsers();
  },
};
