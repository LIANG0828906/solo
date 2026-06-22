
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  favorites: string[];
  transactionCount: number;
}

export interface Walnut {
  id: string;
  name: string;
  variety: string;
  textureDensity: number;
  symmetry: number;
  soundFrequency: number;
  grade: '极品' | '上品' | '中品' | '下品';
  price: number;
  isForSale: boolean;
  ownerId: string | null;
  textureSeed: number;
}

class MemoryDB {
  private users: Map<string, User> = new Map();
  private walnuts: Map<string, Walnut> = new Map();
  private tokens: Map<string, string> = new Map();

  constructor() {
    this.initializeWalnuts();
  }

  private initializeWalnuts() {
    const varieties = [
      { name: '鸡心', variety: '鸡心核桃' },
      { name: '狮子头', variety: '狮子头核桃' },
      { name: '公子帽', variety: '公子帽核桃' },
      { name: '虎头', variety: '虎头核桃' },
      { name: '官帽', variety: '官帽核桃' },
      { name: '四座楼', variety: '四座楼狮子头' },
      { name: '南疆石', variety: '南疆石狮子头' },
      { name: '麦穗虎头', variety: '麦穗虎头' },
      { name: '盘龙纹', variety: '盘龙纹狮子头' },
    ];

    for (let i = 0; i < varieties.length; i++) {
      const v = varieties[i];
      const textureDensity = Math.floor(Math.random() * 50) + 40;
      const symmetry = Math.floor(Math.random() * 40) + 50;
      const soundFrequency = Math.floor(Math.random() * 50) + 40;
      const score = (textureDensity + symmetry + soundFrequency) / 3;
      
      let grade: '极品' | '上品' | '中品' | '下品';
      if (score >= 85) grade = '极品';
      else if (score >= 70) grade = '上品';
      else if (score >= 55) grade = '中品';
      else grade = '下品';

      let price: number;
      switch (grade) {
        case '极品': price = Math.floor(Math.random() * 3000) + 7000; break;
        case '上品': price = Math.floor(Math.random() * 3000) + 3000; break;
        case '中品': price = Math.floor(Math.random() * 1500) + 1000; break;
        case '下品': price = Math.floor(Math.random() * 900) + 100; break;
      }

      const walnut: Walnut = {
        id: uuidv4(),
        name: v.name,
        variety: v.variety,
        textureDensity,
        symmetry,
        soundFrequency,
        grade,
        price,
        isForSale: true,
        ownerId: null,
        textureSeed: Math.random() * 10000,
      };
      this.walnuts.set(walnut.id, walnut);
    }
  }

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  updateUser(user: User): void {
    this.users.set(user.id, user);
  }

  getWalnutById(id: string): Walnut | undefined {
    return this.walnuts.get(id);
  }

  getAllWalnuts(): Walnut[] {
    return Array.from(this.walnuts.values());
  }

  getMarketWalnuts(): Walnut[] {
    return Array.from(this.walnuts.values()).filter(w => w.isForSale);
  }

  updateWalnut(walnut: Walnut): void {
    this.walnuts.set(walnut.id, walnut);
  }

  addToken(token: string, userId: string): void {
    this.tokens.set(token, userId);
  }

  getUserIdByToken(token: string): string | undefined {
    return this.tokens.get(token);
  }

  removeToken(token: string): void {
    this.tokens.delete(token);
  }

  getUserWalnuts(userId: string): Walnut[] {
    return Array.from(this.walnuts.values()).filter(w => w.ownerId === userId);
  }
}

export const db = new MemoryDB();
