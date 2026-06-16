import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { User, ExchangeLog } from '@/types';
import { generateAllMockData } from '@/utils/mock';

interface UserState {
  currentUser: User | null;
  users: User[];
  exchangeLogs: ExchangeLog[];
  isInitialized: boolean;
  initData: () => Promise<void>;
  addPoints: (userId: string, points: number) => Promise<void>;
  getUserRankings: () => User[];
  getExchangeLogsForUser: (userId: string) => ExchangeLog[];
  addExchangeLog: (log: Omit<ExchangeLog, 'id'>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: [],
  exchangeLogs: [],
  isInitialized: false,

  initData: async () => {
    try {
      let users = await get<User[]>('users');
      let currentUser = await get<User>('currentUser');
      let exchangeLogs = await get<ExchangeLog[]>('exchangeLogs');

      if (!users || users.length === 0) {
        const mockData = generateAllMockData();
        users = mockData.users;
        currentUser = mockData.currentUser;
        exchangeLogs = mockData.exchangeLogs;

        await set('users', users);
        await set('currentUser', currentUser);
        await set('exchangeLogs', exchangeLogs);
      }

      if (!currentUser && users && users.length > 0) {
        currentUser = users[0];
        await set('currentUser', currentUser);
      }

      set({ users: users || [], currentUser, exchangeLogs: exchangeLogs || [], isInitialized: true });
    } catch (error) {
      console.error('Failed to init user data:', error);
      const mockData = generateAllMockData();
      set({
        users: mockData.users,
        currentUser: mockData.currentUser,
        exchangeLogs: mockData.exchangeLogs,
        isInitialized: true,
      });
    }
  },

  addPoints: async (userId, points) => {
    const { users } = get();
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, ecoPoints: u.ecoPoints + points } : u
    );
    const updatedCurrentUser =
      get().currentUser?.id === userId
        ? { ...get().currentUser!, ecoPoints: get().currentUser!.ecoPoints + points }
        : get().currentUser;

    set({ users: updatedUsers, currentUser: updatedCurrentUser });
    try {
      await set('users', updatedUsers);
      if (updatedCurrentUser) {
        await set('currentUser', updatedCurrentUser);
      }
    } catch (error) {
      console.error('Failed to save updated points:', error);
    }
  },

  getUserRankings: () => {
    return [...get().users].sort((a, b) => b.ecoPoints - a.ecoPoints);
  },

  getExchangeLogsForUser: (userId) => {
    return get().exchangeLogs.filter(
      (log) => log.user1Id === userId || log.user2Id === userId
    );
  },

  addExchangeLog: async (log) => {
    const newLog: ExchangeLog = { ...log, id: uuidv4() };
    const updatedLogs = [newLog, ...get().exchangeLogs];
    set({ exchangeLogs: updatedLogs });
    try {
      await set('exchangeLogs', updatedLogs);
    } catch (error) {
      console.error('Failed to save exchange log:', error);
    }
  },
}));
