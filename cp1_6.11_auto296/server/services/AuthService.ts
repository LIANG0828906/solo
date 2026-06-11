
import { v4 as uuidv4 } from 'uuid';
import { db, User } from '../db/memoryDb.js';

export class AuthService {
  static register(username: string, password: string): { token: string; user: Omit<User, 'password'> } | null {
    if (db.getUserByUsername(username)) {
      return null;
    }

    const user: User = {
      id: uuidv4(),
      username,
      password,
      balance: 10000,
      favorites: [],
      transactionCount: 0,
    };

    db.addUser(user);
    const token = uuidv4();
    db.addToken(token, user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  static login(username: string, password: string): { token: string; user: Omit<User, 'password'> } | null {
    const user = db.getUserByUsername(username);
    if (!user || user.password !== password) {
      return null;
    }

    const token = uuidv4();
    db.addToken(token, user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  static getUserByToken(token: string): Omit<User, 'password'> | null {
    const userId = db.getUserIdByToken(token);
    if (!userId) return null;

    const user = db.getUserById(userId);
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static logout(token: string): boolean {
    db.removeToken(token);
    return true;
  }
}
