import type { User, Pet, PetStats, InventoryItem, ItemType } from '../types';
import { v4 as uuidv4 } from 'uuid';

class MemoryStore {
  private users: Map<string, User> = new Map();
  
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }
  
  createUser(userId: string, pet: Pet): User {
    const user: User = {
      id: userId,
      pet,
      friends: [],
      friendRequests: [],
      friendliness: 0,
      checkInStreak: 0,
      lastCheckInDate: null,
      backpack: [],
      lastDecayTime: Date.now(),
    };
    this.users.set(userId, user);
    return user;
  }
  
  updatePetStats(userId: string, stats: PetStats, isSick: boolean): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    user.pet.stats = stats;
    user.pet.isSick = isSick;
    user.pet.lastInteraction = Date.now();
    return true;
  }
  
  searchUserById(userId: string): { id: string; petName: string; petColor: string } | null {
    const user = this.users.get(userId);
    if (!user) return null;
    return {
      id: user.id,
      petName: user.pet.name,
      petColor: user.pet.color,
    };
  }
  
  sendFriendRequest(fromId: string, toId: string): boolean {
    const toUser = this.users.get(toId);
    const fromUser = this.users.get(fromId);
    if (!toUser || !fromUser) return false;
    if (toUser.friends.includes(fromId)) return false;
    if (toUser.friendRequests.includes(fromId)) return false;
    
    toUser.friendRequests.push(fromId);
    return true;
  }
  
  acceptFriendRequest(userId: string, friendId: string): boolean {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    if (!user || !friend) return false;
    
    const reqIndex = user.friendRequests.indexOf(friendId);
    if (reqIndex === -1) return false;
    
    user.friendRequests.splice(reqIndex, 1);
    
    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
    }
    if (!friend.friends.includes(userId)) {
      friend.friends.push(userId);
    }
    
    return true;
  }
  
  getFriends(userId: string): Array<{ id: string; petName: string; petColor: string; stats: PetStats; isSick: boolean }> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    return user.friends
      .map(friendId => this.users.get(friendId))
      .filter((f): f is User => f !== undefined)
      .map(f => ({
        id: f.id,
        petName: f.pet.name,
        petColor: f.pet.color,
        stats: f.pet.stats,
        isSick: f.pet.isSick,
      }));
  }
  
  addFriendliness(userId: string, amount: number): number {
    const user = this.users.get(userId);
    if (!user) return 0;
    user.friendliness += amount;
    return user.friendliness;
  }
  
  addItem(userId: string, itemType: ItemType): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const existing = user.backpack.find(item => item.type === itemType);
    if (existing) {
      existing.quantity += 1;
    } else {
      user.backpack.push({
        id: uuidv4(),
        type: itemType,
        quantity: 1,
      });
    }
    return true;
  }
  
  useItem(userId: string, itemType: ItemType): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const itemIndex = user.backpack.findIndex(item => item.type === itemType && item.quantity > 0);
    if (itemIndex === -1) return false;
    
    user.backpack[itemIndex].quantity -= 1;
    if (user.backpack[itemIndex].quantity <= 0) {
      user.backpack.splice(itemIndex, 1);
    }
    return true;
  }
  
  getBackpack(userId: string): InventoryItem[] {
    const user = this.users.get(userId);
    return user ? user.backpack : [];
  }
  
  setLastCheckIn(userId: string, date: string, streak: number): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.lastCheckInDate = date;
    user.checkInStreak = streak;
    return true;
  }
  
  getCheckInStatus(userId: string): { streak: number; lastDate: string | null } {
    const user = this.users.get(userId);
    if (!user) return { streak: 0, lastDate: null };
    return { streak: user.checkInStreak, lastDate: user.lastCheckInDate };
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
  
  setLastDecayTime(userId: string, time: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastDecayTime = time;
    }
  }
}

export const memoryStore = new MemoryStore();
