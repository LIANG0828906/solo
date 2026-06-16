import { memoryStore } from '../store/MemoryStore';
import type { Pet, PetStats, InteractionType, ItemType } from '../types';
import { interact, useItem, checkSick, clampStat, createPet } from '../../client/pet';

export class PetService {
  static getPet(userId: string): Pet | null {
    const user = memoryStore.getUser(userId);
    return user ? user.pet : null;
  }

  static createPet(userId: string, name: string, color: string): Pet {
    const pet = createPet(name, color);
    memoryStore.createUser(userId, pet);
    return pet;
  }

  static interact(userId: string, type: InteractionType): { stats: PetStats; isSick: boolean } | null {
    const user = memoryStore.getUser(userId);
    if (!user || user.pet.isSick) return null;

    const newStats = interact(user.pet.stats, type);
    const isSick = checkSick(newStats);
    
    memoryStore.updatePetStats(userId, newStats, isSick);
    return { stats: newStats, isSick };
  }

  static useItem(userId: string, itemType: ItemType): { stats: PetStats; isSick: boolean } | null {
    const user = memoryStore.getUser(userId);
    if (!user || user.pet.isSick) return null;
    
    const success = memoryStore.useItem(userId, itemType);
    if (!success) return null;

    const newStats = useItem(user.pet.stats, itemType);
    const isSick = checkSick(newStats);
    
    memoryStore.updatePetStats(userId, newStats, isSick);
    return { stats: newStats, isSick };
  }

  static calculateDecayForAll(): void {
    const now = Date.now();
    const users = memoryStore.getAllUsers();
    
    for (const user of users) {
      if (user.pet.isSick) continue;
      
      const minutesElapsed = (now - user.lastDecayTime) / (1000 * 60);
      if (minutesElapsed < 10) continue;
      
      const decayPer10Min = 5;
      const energyDecayPer5Min = 2;
      const periods10 = minutesElapsed / 10;
      const periods5 = minutesElapsed / 5;
      
      const newStats: PetStats = {
        hunger: clampStat(user.pet.stats.hunger - decayPer10Min * periods10),
        happiness: clampStat(user.pet.stats.happiness - decayPer10Min * periods10),
        cleanliness: clampStat(user.pet.stats.cleanliness - decayPer10Min * periods10),
        energy: clampStat(user.pet.stats.energy - energyDecayPer5Min * periods5),
      };
      
      const isSick = checkSick(newStats);
      memoryStore.updatePetStats(user.id, newStats, isSick);
      memoryStore.setLastDecayTime(user.id, now);
    }
  }

  static helpFriend(userId: string, friendId: string, type: InteractionType): { 
    friendPetStats: PetStats; 
    friendliness: number;
  } | null {
    const user = memoryStore.getUser(userId);
    const friend = memoryStore.getUser(friendId);
    
    if (!user || !friend) return null;
    if (!user.friends.includes(friendId)) return null;
    if (friend.pet.isSick) return null;
    
    const increaseAmount = 10;
    const newStats = { ...friend.pet.stats };
    
    switch (type) {
      case 'feed':
        newStats.hunger = clampStat(newStats.hunger + increaseAmount);
        break;
      case 'clean':
        newStats.cleanliness = clampStat(newStats.cleanliness + increaseAmount);
        break;
      case 'play':
        newStats.happiness = clampStat(newStats.happiness + increaseAmount);
        break;
    }
    
    const isSick = checkSick(newStats);
    memoryStore.updatePetStats(friendId, newStats, isSick);
    
    const friendliness = memoryStore.addFriendliness(userId, 1);
    
    return { friendPetStats: newStats, friendliness };
  }
}
