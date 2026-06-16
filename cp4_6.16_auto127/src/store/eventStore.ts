import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { CommunityEvent } from '../types';

interface EventStore {
  events: CommunityEvent[];
  createEvent: (event: CommunityEvent) => Promise<void>;
  registerEvent: (eventId: string, userId: string) => Promise<boolean>;
  cancelRegistration: (eventId: string, userId: string) => Promise<void>;
  getEventById: (eventId: string) => CommunityEvent | undefined;
  getUpcomingEvents: () => CommunityEvent[];
  getThisMonthEventsCount: () => number;
}

const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],

      createEvent: async (event) => {
        set((state) => ({ events: [...state.events, event] }));
      },

      registerEvent: async (eventId, userId) => {
        const event = get().getEventById(eventId);
        if (!event) return false;
        if (event.registeredIds.includes(userId)) return false;
        if (event.registeredIds.length >= event.maxAttendees) return false;

        set((state) => ({
          events: state.events.map((e) =>
            e.eventId === eventId
              ? { ...e, registeredIds: [...e.registeredIds, userId] }
              : e
          ),
        }));
        return true;
      },

      cancelRegistration: async (eventId, userId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.eventId === eventId
              ? { ...e, registeredIds: e.registeredIds.filter((id) => id !== userId) }
              : e
          ),
        }));
      },

      getEventById: (eventId) => {
        return get().events.find((e) => e.eventId === eventId);
      },

      getUpcomingEvents: () => {
        const now = Date.now();
        return get()
          .events.filter((e) => e.date >= now)
          .sort((a, b) => a.date - b.date);
      },

      getThisMonthEventsCount: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
        return get().events.filter(
          (e) => e.date >= startOfMonth && e.date <= endOfMonth
        ).length;
      },
    }),
    {
      name: 'pageturner-events',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.events.length === 0) {
          const now = Date.now();
          state.events = [
            {
              eventId: 'event-1',
              title: '春日读书分享会',
              description: '邀请社区居民分享最近读过的好书，交流阅读心得，共度美好午后时光。',
              date: now + 5 * 86400000,
              location: '社区活动中心二楼会议室',
              maxAttendees: 30,
              registeredIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
              createdAt: now - 7 * 86400000,
            },
            {
              eventId: 'event-2',
              title: '儿童绘本故事时间',
              description: '专为4-10岁儿童设计的绘本阅读活动，由志愿者老师带领孩子们走进奇妙的绘本世界。',
              date: now + 10 * 86400000,
              location: '社区图书馆儿童区',
              maxAttendees: 20,
              registeredIds: ['user-1', 'user-6', 'user-7'],
              createdAt: now - 5 * 86400000,
            },
            {
              eventId: 'event-3',
              title: '图书漂流启动仪式',
              description: '本月图书漂流活动启动，参与即可获得专属漂流书签，让你的书在社区中旅行。',
              date: now + 15 * 86400000,
              location: '社区广场',
              maxAttendees: 100,
              registeredIds: Array.from({ length: 78 }, (_, i) => `user-${i + 10}`),
              createdAt: now - 3 * 86400000,
            },
            {
              eventId: 'event-4',
              title: '经典文学研读沙龙',
              description: '本月主题：《百年孤独》魔幻现实主义的魅力。请提前阅读第七章至第十二章。',
              date: now + 20 * 86400000,
              location: '社区图书馆研讨室',
              maxAttendees: 15,
              registeredIds: ['user-1', 'user-2', 'user-8', 'user-9', 'user-10', 'user-11'],
              createdAt: now - 2 * 86400000,
            },
          ];
        }
      },
    }
  )
);
