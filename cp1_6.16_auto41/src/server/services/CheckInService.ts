import { memoryStore } from '../store/MemoryStore';
import type { ItemType } from '../types';
import { ITEM_INFO } from '../types';

const ITEM_TYPES: ItemType[] = ['energyJuice', 'magicShampoo', 'luxuryFood', 'playToy'];

export class CheckInService {
  static getCheckInStatus(userId: string): {
    todayChecked: boolean;
    streak: number;
    lastDate: string | null;
  } {
    const status = memoryStore.getCheckInStatus(userId);
    const today = this.getTodayString();
    const todayChecked = status.lastDate === today;
    
    return {
      todayChecked,
      streak: status.streak,
      lastDate: status.lastDate,
    };
  }

  static checkIn(userId: string): {
    success: boolean;
    streak: number;
    reward: ItemType;
    rewardName: string;
  } {
    const status = this.getCheckInStatus(userId);
    const today = this.getTodayString();
    
    if (status.todayChecked) {
      return { success: false, streak: status.streak, reward: 'energyJuice', rewardName: '' };
    }
    
    let newStreak = 1;
    if (status.lastDate) {
      const yesterday = this.getYesterdayString();
      if (status.lastDate === yesterday) {
        newStreak = status.streak + 1;
      }
    }
    
    const reward = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    memoryStore.addItem(userId, reward);
    memoryStore.setLastCheckIn(userId, today, newStreak);
    
    return {
      success: true,
      streak: newStreak,
      reward,
      rewardName: ITEM_INFO[reward].name,
    };
  }

  static getBackpack(userId: string) {
    return memoryStore.getBackpack(userId);
  }

  private static getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private static getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }
}
