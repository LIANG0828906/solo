import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import type { PrizePool, Prize, User, WinRecord, Stats, Rarity } from './types';
import { generateId, AVATAR_COLORS, getRandomItem } from './utils';

interface LotteryStore {
  prizePools: PrizePool[];
  activePoolId: string | null;
  users: User[];
  winRecords: WinRecord[];
  isDrawing: boolean;
  danmakuQueue: WinRecord[];

  createPrizePool: (name: string) => void;
  deletePrizePool: (poolId: string) => void;
  setActivePool: (poolId: string | null) => void;
  addPrize: (poolId: string, prize: Omit<Prize, 'id' | 'wonCount'>) => void;
  updatePrize: (poolId: string, prizeId: string, updates: Partial<Prize>) => void;
  deletePrize: (poolId: string, prizeId: string) => void;
  addUser: (name: string) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, name: string) => void;
  addToDanmaku: (record: WinRecord) => void;
  removeFromDanmaku: (recordId: string) => void;
  resetPool: (poolId: string) => void;
  startDraw: () => Promise<WinRecord | null>;
  getActivePool: () => PrizePool | undefined;
  getStats: () => Stats;
}

const createDefaultData = () => {
  const pool1Id = generateId();
  const pool2Id = generateId();

  const prize1Id = generateId();
  const prize2Id = generateId();
  const prize3Id = generateId();
  const prize4Id = generateId();
  const prize5Id = generateId();
  const prize6Id = generateId();

  const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const users: User[] = userNames.map(name => ({
    id: generateId(),
    name,
    avatarColor: getRandomItem(AVATAR_COLORS)
  }));

  const prizePools: PrizePool[] = [
    {
      id: pool1Id,
      name: '年终抽奖',
      createdAt: Date.now() - 86400000,
      prizes: [
        { id: prize1Id, name: 'iPhone 15 Pro', icon: '📱', quantity: 1, wonCount: 0, rarity: 'legendary' },
        { id: prize2Id, name: 'AirPods Pro', icon: '🎧', quantity: 3, wonCount: 0, rarity: 'rare' },
        { id: prize3Id, name: '小米手环', icon: '⌚', quantity: 10, wonCount: 0, rarity: 'common' }
      ]
    },
    {
      id: pool2Id,
      name: '节日活动',
      createdAt: Date.now() - 172800000,
      prizes: [
        { id: prize4Id, name: 'MacBook Pro', icon: '💻', quantity: 1, wonCount: 0, rarity: 'legendary' },
        { id: prize5Id, name: 'Switch 游戏机', icon: '🎮', quantity: 2, wonCount: 0, rarity: 'rare' },
        { id: prize6Id, name: '精美礼品', icon: '🎁', quantity: 20, wonCount: 0, rarity: 'common' }
      ]
    }
  ];

  return {
    prizePools,
    activePoolId: pool1Id,
    users,
    winRecords: [] as WinRecord[]
  };
};

export const useLotteryStore = create<LotteryStore>()(
  persist(
    (set, get) => ({
      prizePools: [],
      activePoolId: null,
      users: [],
      winRecords: [],
      isDrawing: false,
      danmakuQueue: [],

      createPrizePool: (name: string) => {
        set(produce((state: LotteryStore) => {
          state.prizePools.push({
            id: generateId(),
            name,
            prizes: [],
            createdAt: Date.now()
          });
        }));
      },

      deletePrizePool: (poolId: string) => {
        set(produce((state: LotteryStore) => {
          state.prizePools = state.prizePools.filter(p => p.id !== poolId);
          if (state.activePoolId === poolId) {
            state.activePoolId = state.prizePools[0]?.id || null;
          }
        }));
      },

      setActivePool: (poolId: string | null) => {
        set(produce((state: LotteryStore) => {
          state.activePoolId = poolId;
        }));
      },

      addPrize: (poolId: string, prize: Omit<Prize, 'id' | 'wonCount'>) => {
        set(produce((state: LotteryStore) => {
          const pool = state.prizePools.find(p => p.id === poolId);
          if (pool) {
            pool.prizes.push({
              ...prize,
              id: generateId(),
              wonCount: 0
            });
          }
        }));
      },

      updatePrize: (poolId: string, prizeId: string, updates: Partial<Prize>) => {
        set(produce((state: LotteryStore) => {
          const pool = state.prizePools.find(p => p.id === poolId);
          if (pool) {
            const prize = pool.prizes.find(p => p.id === prizeId);
            if (prize) {
              Object.assign(prize, updates);
            }
          }
        }));
      },

      deletePrize: (poolId: string, prizeId: string) => {
        set(produce((state: LotteryStore) => {
          const pool = state.prizePools.find(p => p.id === poolId);
          if (pool) {
            pool.prizes = pool.prizes.filter(p => p.id !== prizeId);
          }
        }));
      },

      addUser: (name: string) => {
        set(produce((state: LotteryStore) => {
          state.users.push({
            id: generateId(),
            name,
            avatarColor: getRandomItem(AVATAR_COLORS)
          });
        }));
      },

      removeUser: (userId: string) => {
        set(produce((state: LotteryStore) => {
          state.users = state.users.filter(u => u.id !== userId);
        }));
      },

      updateUser: (userId: string, name: string) => {
        set(produce((state: LotteryStore) => {
          const user = state.users.find(u => u.id === userId);
          if (user) {
            user.name = name;
          }
        }));
      },

      addToDanmaku: (record: WinRecord) => {
        set(produce((state: LotteryStore) => {
          state.danmakuQueue.push(record);
        }));
      },

      removeFromDanmaku: (recordId: string) => {
        set(produce((state: LotteryStore) => {
          state.danmakuQueue = state.danmakuQueue.filter(r => r.id !== recordId);
        }));
      },

      resetPool: (poolId: string) => {
        set(produce((state: LotteryStore) => {
          const pool = state.prizePools.find(p => p.id === poolId);
          if (pool) {
            pool.prizes.forEach(prize => {
              prize.wonCount = 0;
            });
          }
        }));
      },

      startDraw: async (): Promise<WinRecord | null> => {
        const state = get();
        
        if (!state.activePoolId) return null;
        if (state.isDrawing) return null;
        if (state.users.length === 0) return null;

        const activePool = state.prizePools.find(p => p.id === state.activePoolId);
        if (!activePool) return null;

        const remainingPrizes = activePool.prizes.filter(p => p.wonCount < p.quantity);
        if (remainingPrizes.length === 0) return null;

        set(produce((s: LotteryStore) => {
          s.isDrawing = true;
        }));

        try {
          await new Promise(resolve => setTimeout(resolve, 800));

          const weightPool: Prize[] = [];
          remainingPrizes.forEach(prize => {
            const count = prize.quantity - prize.wonCount;
            for (let i = 0; i < count; i++) {
              weightPool.push(prize);
            }
          });

          const selectedPrize = getRandomItem(weightPool);
          const selectedUser = getRandomItem(state.users);

          const record: WinRecord = {
            id: generateId(),
            prizeId: selectedPrize.id,
            prizeName: selectedPrize.name,
            prizeIcon: selectedPrize.icon,
            prizeRarity: selectedPrize.rarity,
            userId: selectedUser.id,
            userName: selectedUser.name,
            userAvatarColor: selectedUser.avatarColor,
            poolId: state.activePoolId!,
            timestamp: Date.now()
          };

          set(produce((s: LotteryStore) => {
            const pool = s.prizePools.find(p => p.id === s.activePoolId);
            if (pool) {
              const prize = pool.prizes.find(p => p.id === selectedPrize.id);
              if (prize) {
                prize.wonCount++;
              }
            }
            s.winRecords.push(record);
            s.danmakuQueue.push(record);
          }));

          return record;
        } finally {
          set(produce((s: LotteryStore) => {
            s.isDrawing = false;
          }));
        }
      },

      getActivePool: () => {
        const state = get();
        return state.prizePools.find(p => p.id === state.activePoolId);
      },

      getStats: (): Stats => {
        const state = get();
        const allPrizes = state.prizePools.flatMap(p => p.prizes);
        
        const totalPrizes = allPrizes.reduce((sum, p) => sum + p.quantity, 0);
        const wonPrizes = allPrizes.reduce((sum, p) => sum + p.wonCount, 0);

        const calcRate = (rarity: Rarity) => {
          const prizes = allPrizes.filter(p => p.rarity === rarity);
          const total = prizes.reduce((sum, p) => sum + p.quantity, 0);
          const won = prizes.reduce((sum, p) => sum + p.wonCount, 0);
          if (total === 0) return 0;
          return Number(((won / total) * 100).toFixed(1));
        };

        return {
          participantCount: state.users.length,
          totalPrizes,
          wonPrizes,
          remainingPrizes: totalPrizes - wonPrizes,
          rarityRates: {
            common: calcRate('common'),
            rare: calcRate('rare'),
            legendary: calcRate('legendary'),
            epic: 0
          }
        };
      }
    }),
    {
      name: 'lottery-store',
      partialize: (state) => ({
        prizePools: state.prizePools,
        activePoolId: state.activePoolId,
        users: state.users,
        winRecords: state.winRecords
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.prizePools.length === 0) {
          const defaultData = createDefaultData();
          state.prizePools = defaultData.prizePools;
          state.activePoolId = defaultData.activePoolId;
          state.users = defaultData.users;
          state.winRecords = defaultData.winRecords;
        }
      }
    }
  )
);
