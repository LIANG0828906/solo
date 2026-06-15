
import { db, User, Walnut } from '../db/memoryDb.js';

export class UserService {
  static getProfile(userId: string): Omit<User, 'password'> | null {
    const user = db.getUserById(userId);
    if (!user) return null;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static addFavorite(userId: string, walnutId: string): boolean {
    const user = db.getUserById(userId);
    if (!user) return false;
    if (!user.favorites.includes(walnutId)) {
      user.favorites.push(walnutId);
      db.updateUser(user);
    }
    return true;
  }

  static removeFavorite(userId: string, walnutId: string): boolean {
    const user = db.getUserById(userId);
    if (!user) return false;
    user.favorites = user.favorites.filter(id => id !== walnutId);
    db.updateUser(user);
    return true;
  }

  static getFavorites(userId: string): Walnut[] {
    const user = db.getUserById(userId);
    if (!user) return [];
    return user.favorites
      .map(id => db.getWalnutById(id))
      .filter((w): w is Walnut => w !== undefined);
  }

  static syncFavorites(userId: string, favoriteIds: string[]): boolean {
    const user = db.getUserById(userId);
    if (!user) return false;
    user.favorites = favoriteIds;
    db.updateUser(user);
    return true;
  }
}
