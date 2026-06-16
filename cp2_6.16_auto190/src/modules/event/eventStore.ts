import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  addToStore,
  getAllFromStore,
  getFromStore,
  getFromStoreByIndex,
} from '@/utils/indexedDB';
import type { EventItem, CheckIn } from '@/types';

const participantNames = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑小明', '陈小红', '刘大华', '杨丽', '黄强', '徐慧', '马超',
];

function getRandomParticipantName(): string {
  return participantNames[Math.floor(Math.random() * participantNames.length)];
}

interface EventState {
  events: EventItem[];
  currentEvent: EventItem | null;
  checkIns: CheckIn[];
  loading: boolean;
  error: string | null;

  loadEvents: () => Promise<void>;
  createEvent: (data: Omit<EventItem, 'id' | 'createdAt'>) => Promise<EventItem>;
  getEvent: (id: string) => Promise<EventItem | null>;
  checkIn: (eventId: string) => Promise<CheckIn>;
  loadCheckIns: (eventId: string) => Promise<void>;
  getAllCheckIns: () => Promise<CheckIn[]>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  currentEvent: null,
  checkIns: [],
  loading: false,
  error: null,

  loadEvents: async () => {
    set({ loading: true, error: null });
    try {
      const events = await getAllFromStore<EventItem>('events');
      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      set({ events, loading: false });
    } catch (err) {
      set({ error: '加载活动失败', loading: false });
    }
  },

  createEvent: async (data) => {
    const newEvent: EventItem = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await addToStore('events', newEvent);
    const events = [newEvent, ...get().events];
    set({ events });
    return newEvent;
  },

  getEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      const event = await getFromStore<EventItem>('events', id);
      set({ currentEvent: event || null, loading: false });
      return event || null;
    } catch (err) {
      set({ error: '获取活动失败', loading: false });
      return null;
    }
  },

  checkIn: async (eventId) => {
    const checkIn: CheckIn = {
      id: uuidv4(),
      eventId,
      participantName: getRandomParticipantName(),
      timestamp: new Date().toISOString(),
    };
    await addToStore('checkIns', checkIn);
    const checkIns = [...get().checkIns, checkIn];
    set({ checkIns });
    return checkIn;
  },

  loadCheckIns: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const checkIns = await getFromStoreByIndex<CheckIn>('checkIns', 'eventId', eventId);
      checkIns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      set({ checkIns, loading: false });
    } catch (err) {
      set({ error: '加载签到记录失败', loading: false });
    }
  },

  getAllCheckIns: async () => {
    try {
      const checkIns = await getAllFromStore<CheckIn>('checkIns');
      return checkIns;
    } catch {
      return [];
    }
  },
}));
