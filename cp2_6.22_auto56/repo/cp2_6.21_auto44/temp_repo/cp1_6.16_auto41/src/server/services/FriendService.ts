import { memoryStore } from '../store/MemoryStore';
import type { PetStats } from '../types';

export class FriendService {
  static searchUser(userId: string): { id: string; petName: string; petColor: string } | null {
    return memoryStore.searchUserById(userId);
  }

  static sendRequest(fromId: string, toId: string): boolean {
    if (fromId === toId) return false;
    return memoryStore.sendFriendRequest(fromId, toId);
  }

  static acceptRequest(userId: string, friendId: string): boolean {
    return memoryStore.acceptFriendRequest(userId, friendId);
  }

  static getFriends(userId: string): Array<{ 
    id: string; 
    petName: string; 
    petColor: string; 
    stats: PetStats; 
    isSick: boolean;
  }> {
    return memoryStore.getFriends(userId);
  }

  static getFriendDetail(userId: string, friendId: string): {
    id: string;
    petName: string;
    petColor: string;
    stats: PetStats;
    isSick: boolean;
  } | null {
    const user = memoryStore.getUser(userId);
    if (!user || !user.friends.includes(friendId)) return null;
    
    const friend = memoryStore.getUser(friendId);
    if (!friend) return null;
    
    return {
      id: friend.id,
      petName: friend.pet.name,
      petColor: friend.pet.color,
      stats: friend.pet.stats,
      isSick: friend.pet.isSick,
    };
  }

  static getFriendRequests(userId: string): Array<{ id: string; petName: string; petColor: string }> {
    const user = memoryStore.getUser(userId);
    if (!user) return [];
    
    return user.friendRequests
      .map(id => memoryStore.getUser(id))
      .filter((u): u is NonNullable<ReturnType<typeof memoryStore.getUser>> => u !== undefined)
      .map(u => ({
        id: u.id,
        petName: u.pet.name,
        petColor: u.pet.color,
      }));
  }
}
