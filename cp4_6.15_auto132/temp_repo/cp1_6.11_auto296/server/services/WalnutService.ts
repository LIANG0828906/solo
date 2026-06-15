
import { db, Walnut, User } from '../db/memoryDb.js';

export class WalnutService {
  static getAllWalnuts(): Walnut[] {
    return db.getAllWalnuts();
  }

  static getWalnutById(id: string): Walnut | undefined {
    return db.getWalnutById(id);
  }

  static getMarketWalnuts(): Walnut[] {
    return db.getMarketWalnuts();
  }

  static buyWalnut(walnutId: string, userId: string): { success: boolean; message: string; walnut?: Walnut; user?: Omit<User, 'password'> } {
    const walnut = db.getWalnutById(walnutId);
    if (!walnut) {
      return { success: false, message: '核桃不存在' };
    }

    if (!walnut.isForSale || walnut.ownerId) {
      return { success: false, message: '该核桃已售出' };
    }

    const user = db.getUserById(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (user.balance < walnut.price) {
      return { success: false, message: '银钱不足，还请多多把玩' };
    }

    user.balance -= walnut.price;
    user.transactionCount += 1;
    if (!user.favorites.includes(walnutId)) {
      user.favorites.push(walnutId);
    }
    walnut.isForSale = false;
    walnut.ownerId = userId;

    db.updateUser(user);
    db.updateWalnut(walnut);

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, message: '购买成功', walnut, user: userWithoutPassword };
  }

  static getUserWalnuts(userId: string): Walnut[] {
    return db.getUserWalnuts(userId);
  }
}
